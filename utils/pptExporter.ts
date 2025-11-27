import pptxgen from 'pptxgenjs';
import { InfographicData, InfographicChart, InfographicSection, BrandConfig } from '../types';

export const exportToPPTX = async (
  data: InfographicData, 
  filename: string, 
  brandConfig?: BrandConfig
) => {
  const pres = new pptxgen();

  // --- Theme Setup ---
  // Simple mapping of styles to PPT colors
  let bgColor = "FFFFFF";
  let textColor = "363636";
  let accentColor = data.themeColor.replace('#', '');
  
  if (data.style === 'digital') {
    bgColor = "111827"; // Dark gray
    textColor = "FFFFFF";
  } else if (data.style === 'comic') {
    bgColor = "FEF08A"; // Yellow-ish
    textColor = "000000";
  }

  // Set Metadata
  pres.title = data.mainTitle;
  pres.subject = data.subtitle;

  // --- Slide 1: Cover ---
  const slideCover = pres.addSlide();
  slideCover.background = { color: bgColor };
  
  // Title
  slideCover.addText(data.mainTitle, {
    x: 0.5, y: '30%', w: '90%', h: 1.5,
    fontSize: 44,
    bold: true,
    color: textColor,
    align: 'center',
    isTextBox: true
  });

  // Subtitle
  slideCover.addText(data.subtitle, {
    x: 1, y: '50%', w: '80%', h: 1,
    fontSize: 24,
    color: accentColor,
    align: 'center'
  });

  // Branding Footer
  if (brandConfig?.isEnabled && brandConfig.footerText) {
    slideCover.addText(brandConfig.footerText, {
      x: 0, y: '90%', w: '100%', h: 0.5,
      fontSize: 12,
      color: '888888',
      align: 'center'
    });
  }

  // --- Slide 2: Statistics ---
  if (data.statistics.length > 0) {
    const slideStats = pres.addSlide();
    slideStats.background = { color: bgColor };
    
    slideStats.addText("Key Statistics", {
      x: 0.5, y: 0.5, w: '90%', h: 0.5,
      fontSize: 28,
      bold: true,
      color: accentColor
    });

    // Create a grid for stats
    const statsCount = data.statistics.length;
    const colWidth = 10 / (statsCount > 4 ? 4 : statsCount); // spread across 10 inches
    
    data.statistics.forEach((stat, index) => {
      const xPos = 0.5 + (index * 2.4);
      
      // Value
      slideStats.addText(stat.value, {
        x: xPos, y: 2.5, w: 2.2, h: 1,
        fontSize: 36,
        bold: true,
        color: textColor,
        align: 'center'
      });
      
      // Label
      slideStats.addText(stat.label, {
        x: xPos, y: 3.5, w: 2.2, h: 0.5,
        fontSize: 16,
        color: '888888',
        align: 'center'
      });
    });
  }

  // --- Content Slides ---
  // We'll put 1 or 2 sections per slide depending on content length
  data.sections.forEach((section, index) => {
    const slide = pres.addSlide();
    slide.background = { color: bgColor };

    // Header
    slide.addText(section.title, {
      x: 0.5, y: 0.4, w: '90%', h: 0.5,
      fontSize: 24,
      bold: true,
      color: accentColor,
      shape: pres.ShapeType.rect,
      fill: { color: bgColor } // opaque background for header
    });

    // Image (if exists)
    if (section.imageUrl) {
      slide.addImage({
        data: section.imageUrl,
        x: 0.5, y: 1.2, w: 4, h: 3
      });
      
      // Content next to image
      slide.addText(section.content, {
        x: 5, y: 1.2, w: 4.5, h: 4,
        fontSize: 16,
        color: textColor,
        bullet: true
      });
    } else {
      // Full width content if no image
      slide.addText(section.content, {
        x: 0.5, y: 1.2, w: '90%', h: 4,
        fontSize: 18,
        color: textColor,
        bullet: true
      });
    }

    // Add footer to every slide if branding enabled
    if (brandConfig?.isEnabled && brandConfig.footerText) {
      slide.addText(brandConfig.footerText, {
        x: 8, y: 5.2, w: 2, h: 0.3,
        fontSize: 9,
        color: 'AAAAAA',
        align: 'right'
      });
    }
  });

  // --- Charts Slides ---
  if (data.charts && data.charts.length > 0) {
    data.charts.forEach(chart => {
      const slide = pres.addSlide();
      slide.background = { color: bgColor };

      slide.addText(chart.title, {
        x: 0.5, y: 0.4, w: '90%', h: 0.5,
        fontSize: 24,
        bold: true,
        color: accentColor
      });

      // Transform data for PPT
      const chartDataLabels = chart.data.map(d => d.label);
      const chartDataValues = chart.data.map(d => d.value);

      if (chart.type === 'bar') {
        slide.addChart(pres.ChartType.bar, 
          [{
            name: chart.title,
            labels: chartDataLabels,
            values: chartDataValues
          }],
          { x: 1, y: 1.2, w: 8, h: 4, barDir: 'col', showValue: true, chartColors: [accentColor] }
        );
      } else {
        slide.addChart(pres.ChartType.pie, 
          [{
            name: chart.title,
            labels: chartDataLabels,
            values: chartDataValues
          }],
          { x: 2, y: 1.2, w: 6, h: 4, showLegend: true, showPercent: true, showValue: false }
        );
      }
      
      if (chart.description) {
         slide.addText(chart.description, {
            x: 1, y: 5.3, w: 8, h: 0.5,
            fontSize: 12,
            italic: true,
            color: '888888',
            align: 'center'
         });
      }
    });
  }

  // --- Conclusion Slide ---
  const slideEnd = pres.addSlide();
  slideEnd.background = { color: bgColor };
  
  slideEnd.addText("Conclusion", {
    x: 0.5, y: 2, w: '30%', h: 0.5,
    fontSize: 20,
    bold: true,
    color: accentColor
  });
  
  slideEnd.addText(data.conclusion, {
    x: 0.5, y: 2.6, w: '90%', h: 2,
    fontSize: 18,
    color: textColor,
    shape: pres.ShapeType.rect,
    fill: { color: data.style === 'digital' ? '1F2937' : 'F3F4F6' } // slight box background
  });

  // Save the presentation
  await pres.writeFile({ fileName: filename });
};
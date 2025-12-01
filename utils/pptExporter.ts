
import pptxgen from 'pptxgenjs';
import { InfographicData, InfographicChart, InfographicSection, BrandConfig, PresentationData } from '../types';

// Helper to normalize HEX colors. 
// Removes invalid characters and ensures a valid 6-char HEX.
// Returns a fallback if invalid (e.g. user provided "Blue" or chinese text).
const normalizeHexColor = (colorStr: string, fallback: string = "363636"): string => {
  if (!colorStr) return fallback;
  
  // Remove hash
  let hex = colorStr.replace(/[^a-fA-F0-9]/g, '');
  
  // If it's 3 digits, expand to 6
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  // If valid 6 digits, return it
  if (hex.length === 6) {
    return hex;
  }

  // If invalid (e.g. named color like 'blue' that turned into empty or weird string), return fallback
  return fallback;
};

export const exportToPPTX = async (
  data: InfographicData, 
  filename: string, 
  brandConfig?: BrandConfig
) => {
  const pres = new pptxgen();

  // --- Theme Setup ---
  let bgColor = "FFFFFF";
  let textColor = "363636";
  let accentColor = normalizeHexColor(data.themeColor, "4f46e5");
  
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

// NEW: Native Presentation Export
export const exportPresentationToPPTX = async (
  data: PresentationData,
  filename: string,
  brandConfig?: BrandConfig
) => {
  const pres = new pptxgen();
  
  // Theme configuration
  const accentColor = normalizeHexColor(data.themeColor, "4f46e5");
  const textColor = data.style === 'digital' ? "FFFFFF" : "333333";
  const bgColor = data.style === 'digital' ? "111827" : "FFFFFF";

  // Master Slide Definition
  pres.defineSlideMaster({
    title: "MASTER_SLIDE",
    background: { color: bgColor },
    objects: [
      { rect: { x: 0, y: 5.3, w: "100%", h: 0.3, fill: { color: accentColor } } } // Footer bar
    ]
  });

  // Footer for all slides
  const addFooter = (slide: any) => {
    if (brandConfig?.isEnabled && brandConfig.footerText) {
      slide.addText(brandConfig.footerText, {
        x: 8, y: 5.35, w: 2, h: 0.25,
        fontSize: 10,
        color: "FFFFFF",
        align: "right"
      });
    }
  };

  data.slides.forEach(slideData => {
    const slide = pres.addSlide({ masterName: "MASTER_SLIDE" });
    
    // Add Speaker Notes
    if (slideData.speakerNotes) {
      slide.addNotes(slideData.speakerNotes);
    }

    // Handle Layouts
    switch (slideData.layout) {
      case 'title_cover':
        slide.addText(slideData.title, {
          x: 0.5, y: 2, w: '90%', h: 1.5,
          fontSize: 48, bold: true, color: accentColor, align: 'center'
        });
        slide.addText(slideData.content, {
          x: 1, y: 3.5, w: '80%', h: 1,
          fontSize: 24, color: textColor, align: 'center'
        });
        break;

      case 'section_header':
        slide.background = { color: accentColor };
        slide.addText(slideData.title, {
          x: 0.5, y: 2.5, w: '90%', h: 1,
          fontSize: 40, bold: true, color: "FFFFFF", align: 'center'
        });
        break;

      case 'big_number':
        slide.addText(slideData.title, {
          x: 0.5, y: 0.5, w: '90%', h: 0.5,
          fontSize: 28, bold: true, color: accentColor
        });
        slide.addText(slideData.statValue || "", {
          x: 0.5, y: 2, w: '90%', h: 1.5,
          fontSize: 72, bold: true, color: accentColor, align: 'center'
        });
        slide.addText(slideData.content, {
          x: 1, y: 3.5, w: '80%', h: 1,
          fontSize: 20, color: textColor, align: 'center'
        });
        break;

      case 'text_and_image':
        slide.addText(slideData.title, {
          x: 0.5, y: 0.5, w: '90%', h: 0.5,
          fontSize: 28, bold: true, color: accentColor
        });
        if (slideData.imageUrl) {
          slide.addImage({ data: slideData.imageUrl, x: 5.5, y: 1.5, w: 4, h: 3 });
          slide.addText(slideData.content, {
             x: 0.5, y: 1.5, w: 4.5, h: 3.5,
             fontSize: 18, color: textColor, bullet: true
          });
        } else {
          slide.addText(slideData.content, {
             x: 0.5, y: 1.5, w: 9, h: 3.5,
             fontSize: 18, color: textColor, bullet: true
          });
        }
        break;
      
      case 'diagram_image': // NEW Layout for full slide diagrams
        slide.addText(slideData.title, {
          x: 0.5, y: 0.2, w: '90%', h: 0.5,
          fontSize: 24, bold: true, color: accentColor, align: 'center'
        });
        if (slideData.imageUrl) {
          // Maximize image size for diagram
          slide.addImage({ data: slideData.imageUrl, x: 1, y: 0.8, w: 8, h: 4.5 });
        }
        break;

      case 'bullet_list':
        slide.addText(slideData.title, {
          x: 0.5, y: 0.5, w: '90%', h: 0.5,
          fontSize: 28, bold: true, color: accentColor
        });
        slide.addText(slideData.content, {
          x: 0.5, y: 1.5, w: 9, h: 3.5,
          fontSize: 18, color: textColor, bullet: true, lineSpacing: 32
        });
        break;
      
      case 'quote':
        slide.addText(`"${slideData.content}"`, {
          x: 1, y: 2, w: 8, h: 2,
          fontSize: 24, italic: true, color: textColor, align: 'center'
        });
        slide.addText(`- ${slideData.title}`, {
          x: 1, y: 4, w: 8, h: 0.5,
          fontSize: 16, color: accentColor, align: 'right'
        });
        break;

      default: // Generic
        slide.addText(slideData.title, {
          x: 0.5, y: 0.5, w: '90%', h: 0.5,
          fontSize: 28, bold: true, color: accentColor
        });
        slide.addText(slideData.content, {
          x: 0.5, y: 1.5, w: 9, h: 3.5,
          fontSize: 18, color: textColor
        });
        break;
    }

    addFooter(slide);
  });

  await pres.writeFile({ fileName: filename });
};

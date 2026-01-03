
import { jsPDF } from "jspdf";
import { SongAnalysis, StyleBlendAnalysis, CareerRoadmap, ComparisonResult, ProgressionReport, SocialCampaignStrategy } from "../types";

interface ReportData {
  analysis: SongAnalysis | null;
  styleBlend: StyleBlendAnalysis | null;
  roadmap: CareerRoadmap | null;
  comparison: ComparisonResult | ProgressionReport | null;
  socialStrategy?: SocialCampaignStrategy | null;
}

export const generateMasterReport = (data: ReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 20;

  // --- HELPER FUNCTIONS ---
  
  const checkPageBreak = (heightNeeded: number) => {
    if (yPos + heightNeeded > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  };

  const addHeader = (text: string, color: [number, number, number] = [0, 0, 0]) => {
    checkPageBreak(20);
    doc.setFillColor(...color); // Background color
    doc.rect(margin, yPos, pageWidth - (margin * 2), 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(text.toUpperCase(), margin + 5, yPos + 8);
    yPos += 20;
    doc.setTextColor(0, 0, 0); // Reset to black
  };

  const addSectionTitle = (text: string) => {
    checkPageBreak(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(text, margin, yPos);
    yPos += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const addWrappedText = (text: string, fontSize = 10, fontStyle = "normal", indent = 0) => {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(fontSize);
    const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2) - indent);
    checkPageBreak(splitText.length * 5);
    doc.text(splitText, margin + indent, yPos);
    yPos += (splitText.length * 5) + 2;
  };

  const addKeyValuePair = (key: string, value: string) => {
    checkPageBreak(6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${key}:`, margin, yPos);
    doc.setFont("helvetica", "normal");
    const valueSplit = doc.splitTextToSize(value, pageWidth - margin - 60);
    doc.text(valueSplit, margin + 40, yPos);
    yPos += (valueSplit.length * 5) + 2;
  };

  // --- TITLE PAGE ---
  doc.setFillColor(10, 10, 10); // Black
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  doc.setTextColor(168, 85, 247); // Purple 500
  doc.setFontSize(40);
  doc.setFont("helvetica", "bold");
  doc.text("SonicMF", pageWidth / 2, pageHeight / 2 - 20, { align: "center" });
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("MASTER AUDIO INTELLIGENCE REPORT", pageWidth / 2, pageHeight / 2, { align: "center" });
  
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight / 2 + 15, { align: "center" });
  
  doc.addPage();
  yPos = 20;

  // --- SECTION 1: ANALYZER ---
  if (data.analysis) {
    const a = data.analysis;
    addHeader("Sonic Analyzer Report", [88, 28, 135]); // Purple 900

    // Basic Info
    addSectionTitle("Track Metadata");
    addKeyValuePair("Title", a.trackTitle || "Unknown");
    addKeyValuePair("Artist", a.artist || "Unknown");
    addKeyValuePair("BPM", a.bpm);
    addKeyValuePair("Key", a.musicalKey);
    addKeyValuePair("Genre", `${a.genre} (${a.genreConfidence}%)`);
    yPos += 5;

    // Scores
    addSectionTitle("Performance Audit");
    addKeyValuePair("Industry Score", `${a.feedback.industryScore}/100`);
    addKeyValuePair("Production Score", `${a.feedback.productionScore}/100`);
    addKeyValuePair("Songwriting Score", `${a.feedback.lyricsScore}/100`);
    yPos += 5;

    // Detailed Analysis
    addSectionTitle("Executive Summary");
    addWrappedText(a.detailedAnalysis);
    yPos += 5;

    // Strengths & Weaknesses
    addSectionTitle("Critical Feedback");
    doc.setTextColor(22, 163, 74); // Green
    doc.setFont("helvetica", "bold");
    doc.text("Strengths:", margin, yPos);
    yPos += 6;
    doc.setTextColor(0,0,0);
    a.feedback.strengths.forEach(s => addWrappedText(`• ${s}`, 10, "normal", 5));
    
    yPos += 5;
    doc.setTextColor(220, 38, 38); // Red
    doc.setFont("helvetica", "bold");
    doc.text("Improvements:", margin, yPos);
    yPos += 6;
    doc.setTextColor(0,0,0);
    a.feedback.improvements.forEach(imp => {
        addWrappedText(`• Issue: ${imp.critique}`, 10, "bold", 5);
        addWrappedText(`  Fix: ${imp.suggestion}`, 10, "italic", 5);
    });

    // Mix Advice
    yPos += 10;
    addSectionTitle("Mix & Master Surgery");
    a.mixingMastering.eqSuggestions.forEach(eq => {
        addWrappedText(`${eq.element} @ ${eq.frequency}: ${eq.action} (${eq.reason})`, 9, "normal", 5);
    });
    
    // Electronic Elements (if applicable)
    if (a.electronicProduction && a.electronicProduction.isElectronic) {
        yPos += 10;
        addSectionTitle("Sound Design Recipes");
        a.electronicProduction.elements.forEach(el => {
             addWrappedText(`Element: ${el.name} (${el.type})`, 10, "bold", 5);
             addWrappedText(`Recipe: ${el.advice}`, 9, "italic", 5);
             yPos += 2;
        });
    }
  }

  // --- SECTION 2: STYLE BLENDER ---
  if (data.styleBlend) {
    doc.addPage();
    yPos = 20;
    addHeader("Style Blender Protocol", [192, 38, 211]); // Fuchsia 700

    const sb = data.styleBlend;
    addSectionTitle("Synthesis Concept");
    addWrappedText(sb.synthesisConcept);
    yPos += 5;

    addSectionTitle("Target Specs");
    addKeyValuePair("BPM", sb.suggestedBpm);
    addKeyValuePair("Key", sb.suggestedKey);
    yPos += 5;

    addSectionTitle("Production Recipe");
    sb.productionRecipe.forEach((step, i) => {
        addWrappedText(`${i+1}. ${step.title}`, 11, "bold");
        addWrappedText(step.instruction, 10, "normal");
        addWrappedText(`Tip: ${step.technicalTip}`, 9, "italic", 5);
        yPos += 4;
    });
  }

  // --- SECTION 3: COMPARATOR ---
  if (data.comparison) {
    doc.addPage();
    yPos = 20;
    addHeader("Comparison Analysis", [220, 38, 38]); // Red 700

    const c = data.comparison;
    // Type Guard for Progression Report
    const isProgression = (res: any): res is ProgressionReport => (res as ProgressionReport).growthScore !== undefined;

    if (isProgression(c)) {
        addSectionTitle(`Evolution Report (Growth: ${c.growthScore}/100)`);
    } else {
        addSectionTitle(`Versus Battle (Winner: ${c.winner})`);
    }

    addWrappedText(c.summary);
    yPos += 5;

    addSectionTitle("Key Difference");
    addWrappedText(c.keyDifference);
    yPos += 5;

    addSectionTitle("Category Breakdown");
    c.categories.forEach(cat => {
        addWrappedText(`${cat.name}: A(${cat.scoreA}) vs B(${cat.scoreB})`, 10, "bold");
        addWrappedText(cat.notes, 9, "italic", 5);
    });

    if (isProgression(c)) {
        yPos += 5;
        addSectionTitle("Specific Improvements");
        c.improvements.forEach(imp => {
            addWrappedText(`• ${imp.area}: ${imp.verdict}`, 10, "bold");
            addWrappedText(`  Before: ${imp.before}`, 9, "normal", 5);
            addWrappedText(`  After: ${imp.after}`, 9, "normal", 5);
        });
    }
  }

  // --- SECTION 4: CAREER MANAGER ---
  if (data.roadmap) {
    doc.addPage();
    yPos = 20;
    addHeader("Career Strategy Roadmap", [37, 99, 235]); // Blue 600
    
    const r = data.roadmap;
    addSectionTitle(`Strategy for: ${r.artistName} (${r.archetype})`);
    
    addSectionTitle("Mission Statement");
    addWrappedText(r.missionStatement, 10, "italic");
    yPos += 5;

    addSectionTitle("KPI Targets (90 Days)");
    r.kpis.forEach(k => {
        addWrappedText(`• ${k.metric}: ${k.target}`, 10, "bold");
    });
    yPos += 5;

    addSectionTitle("Phased Execution Plan");
    r.phases.forEach(phase => {
        checkPageBreak(30);
        addWrappedText(`[${phase.title}] - ${phase.focus}`, 11, "bold");
        phase.tasks.forEach(task => {
            addWrappedText(`• ${task.week}: ${task.action}`, 10, "normal", 5);
        });
        yPos += 5;
    });
  }

  // --- SECTION 5: SOCIAL STRATEGY ---
  if (data.socialStrategy) {
    doc.addPage();
    yPos = 20;
    addHeader("Social Media Operations", [219, 39, 119]); // Pink 600

    const s = data.socialStrategy;
    addSectionTitle("Campaign Theme");
    addWrappedText(s.campaignTheme, 12, "italic");
    yPos += 5;

    addSectionTitle("Content Pillars");
    s.contentPillars.forEach((p, i) => {
        addWrappedText(`${i+1}. ${p.title}`, 10, "bold");
        addWrappedText(p.description, 9, "normal", 5);
        yPos += 3;
    });
    yPos += 5;

    addSectionTitle("Scheduled Posts");
    s.posts.forEach((post, i) => {
        checkPageBreak(30);
        addWrappedText(`[${post.platform}] - ${post.bestTime}`, 10, "bold");
        addWrappedText(`Concept: ${post.visualConcept}`, 9, "italic", 5);
        addWrappedText(`Caption: ${post.caption}`, 9, "normal", 5);
        addWrappedText(`Tags: ${post.hashtags.join(" ")}`, 8, "normal", 5);
        yPos += 5;
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: "right" });
  }

  doc.save("SonicMF_Master_Report.pdf");
};

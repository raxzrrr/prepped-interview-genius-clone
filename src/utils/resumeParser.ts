import * as pdfjs from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.min.mjs';

// Set the worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ParsedResumeData {
  rawText: string;
  sections: {
    education: string;
    experience: string;
    skills: string;
    projects: string;
  };
}

export const parseResumeFile = async (file: File): Promise<ParsedResumeData> => {
  try {
    console.log('Starting PDF parsing for file:', file.name);
    
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF document
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    console.log('PDF loaded, pages:', pdf.numPages);
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .filter((item): item is any => 'str' in item)
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
      console.log(`Page ${pageNum} extracted, characters:`, pageText.length);
    }
    
    console.log('Full text extracted, total characters:', fullText.length);
    console.log('Raw parsed text preview:', fullText.substring(0, 500) + '...');
    
    // Parse into structured sections
    const sections = parseTextIntoSections(fullText);
    
    return {
      rawText: fullText.trim(),
      sections
    };
  } catch (error) {
    console.error('Error parsing PDF file:', error);
    throw new Error('Failed to parse PDF file. Please ensure it\'s a valid PDF document.');
  }
};

const parseTextIntoSections = (text: string): ParsedResumeData['sections'] => {
  const lowerText = text.toLowerCase();
  
  // Define section keywords and patterns
  const sectionPatterns = {
    education: /(?:education|qualifications|academic|degree|university|college|school)/gi,
    experience: /(?:experience|work|employment|career|professional|job)/gi,
    skills: /(?:skills|technical|technologies|proficiencies|competencies|expertise)/gi,
    projects: /(?:projects|portfolio|achievements|accomplishments)/gi
  };
  
  // Split text into potential sections
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  const sections = {
    education: '',
    experience: '',
    skills: '',
    projects: ''
  };
  
  let currentSection = '';
  let sectionContent: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    const lowerLine = trimmedLine.toLowerCase();
    
    // Check if this line is likely a section header
    let newSection = '';
    if (sectionPatterns.education.test(lowerLine) && lowerLine.length < 50) {
      newSection = 'education';
    } else if (sectionPatterns.experience.test(lowerLine) && lowerLine.length < 50) {
      newSection = 'experience';
    } else if (sectionPatterns.skills.test(lowerLine) && lowerLine.length < 50) {
      newSection = 'skills';
    } else if (sectionPatterns.projects.test(lowerLine) && lowerLine.length < 50) {
      newSection = 'projects';
    }
    
    // If we found a new section header
    if (newSection) {
      // Save previous section content
      if (currentSection && sectionContent.length > 0) {
        sections[currentSection as keyof typeof sections] += sectionContent.join('\n') + '\n';
      }
      
      // Start new section
      currentSection = newSection;
      sectionContent = [trimmedLine];
    } else if (currentSection) {
      // Add content to current section
      sectionContent.push(trimmedLine);
    } else {
      // If no current section, try to categorize by content keywords
      if (sectionPatterns.skills.test(lowerLine)) {
        sections.skills += trimmedLine + '\n';
      } else if (sectionPatterns.education.test(lowerLine)) {
        sections.education += trimmedLine + '\n';
      } else if (sectionPatterns.experience.test(lowerLine)) {
        sections.experience += trimmedLine + '\n';
      } else if (sectionPatterns.projects.test(lowerLine)) {
        sections.projects += trimmedLine + '\n';
      }
    }
  }
  
  // Save the last section
  if (currentSection && sectionContent.length > 0) {
    sections[currentSection as keyof typeof sections] += sectionContent.join('\n');
  }
  
  // Clean up sections
  Object.keys(sections).forEach(key => {
    sections[key as keyof typeof sections] = sections[key as keyof typeof sections].trim();
  });
  
  console.log('Parsed sections:', {
    education: sections.education.substring(0, 100) + '...',
    experience: sections.experience.substring(0, 100) + '...',
    skills: sections.skills.substring(0, 100) + '...',
    projects: sections.projects.substring(0, 100) + '...'
  });
  
  return sections;
};

export const formatParsedResumeForAPI = (parsedData: ParsedResumeData): string => {
  const { rawText, sections } = parsedData;
  
  return `RESUME CONTENT:

RAW TEXT:
${rawText}

STRUCTURED SECTIONS:

EDUCATION:
${sections.education || 'No education section found'}

WORK EXPERIENCE:
${sections.experience || 'No experience section found'}

SKILLS:
${sections.skills || 'No skills section found'}

PROJECTS:
${sections.projects || 'No projects section found'}`;
};

import jsPDF from 'jspdf';

interface CertificateData {
  userName: string;
  certificateTitle: string;
  completionDate: string;
  score?: number;
  verificationCode: string;
}

export const generateCertificatePDF = (data: CertificateData): jsPDF => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Background gradient effect
  pdf.setFillColor(240, 248, 255);
  pdf.rect(0, 0, 297, 210, 'F');

  // Border
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(2);
  pdf.rect(10, 10, 277, 190);

  // Inner border
  pdf.setDrawColor(147, 197, 253);
  pdf.setLineWidth(1);
  pdf.rect(15, 15, 267, 180);

  // Title
  pdf.setFontSize(32);
  pdf.setTextColor(30, 64, 175);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Certificate of Achievement', 148.5, 50, { align: 'center' });

  // Decorative line
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(1);
  pdf.line(100, 60, 197, 60);

  // Main text
  pdf.setFontSize(16);
  pdf.setTextColor(75, 85, 99);
  pdf.setFont('helvetica', 'normal');
  pdf.text('This certifies that', 148.5, 80, { align: 'center' });

  // Student name
  pdf.setFontSize(28);
  pdf.setTextColor(59, 130, 246);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.userName, 148.5, 100, { align: 'center' });

  // Achievement text
  pdf.setFontSize(16);
  pdf.setTextColor(75, 85, 99);
  pdf.setFont('helvetica', 'normal');
  pdf.text('has successfully completed', 148.5, 115, { align: 'center' });

  // Certificate title
  pdf.setFontSize(20);
  pdf.setTextColor(30, 64, 175);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.certificateTitle, 148.5, 135, { align: 'center' });

  // Score if available
  if (data.score) {
    pdf.setFontSize(14);
    pdf.setTextColor(34, 197, 94);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Final Score: ${data.score}%`, 148.5, 150, { align: 'center' });
  }

  // Date and verification
  pdf.setFontSize(12);
  pdf.setTextColor(107, 114, 128);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Date of Completion: ${data.completionDate}`, 60, 170);
  pdf.text(`Verification Code: ${data.verificationCode}`, 60, 180);

  // Signature area
  pdf.setDrawColor(107, 114, 128);
  pdf.line(200, 175, 250, 175);
  pdf.text('Authorized Signature', 225, 185, { align: 'center' });

  return pdf;
};

export const downloadCertificate = (data: CertificateData) => {
  const pdf = generateCertificatePDF(data);
  const fileName = `${data.certificateTitle.replace(/\s+/g, '_')}_${data.verificationCode}.pdf`;
  pdf.save(fileName);
};

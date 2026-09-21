const fs = require('fs');
const filePath = '/home/av/Desktop/win_Desktop_data/Desktop/Work/av/Logic Mind projects/internship/paawan setu/frontend/src/pages/admin/TestAnalytics.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add html2canvas and jspdf imports
if (!content.includes('import html2canvas')) {
    content = content.replace(
        "import {",
        "import html2canvas from 'html2canvas';\nimport { jsPDF } from 'jspdf';\nimport {"
    );
}
// Add PictureAsPdf icon
if (!content.includes('PictureAsPdf')) {
    content = content.replace(
        "Close as CloseIcon, Visibility, Refresh",
        "Close as CloseIcon, Visibility, Refresh, PictureAsPdf"
    );
}

// 2. Modify ResultDetailsDialog
// First find function ResultDetailsDialog({ open, onClose, result, test }) {
// and add const pdfRef = useRef(null); ...
const dialogStart = content.indexOf('function ResultDetailsDialog({ open, onClose, result, test }) {');
const dialogEnd = content.indexOf('function EmptyDashboard() {', dialogStart) || content.indexOf('/* AdminIndex', dialogStart);

let dialogCode = content.substring(dialogStart, dialogEnd);

if (!dialogCode.includes('pdfRef')) {
    const replacement = `function ResultDetailsDialog({ open, onClose, result, test }) {
  const pdfRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPdf = async () => {
    const element = pdfRef.current;
    if (!element || isExporting) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(\`\${result?.user?.name || 'Anonymous'}_Test_Result.pdf\`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
    } finally {
      setIsExporting(false);
    }
  };`;
    dialogCode = dialogCode.replace('function ResultDetailsDialog({ open, onClose, result, test }) {', replacement);
}

// Add ref to DialogContent
dialogCode = dialogCode.replace('<DialogContent sx={{ mt: 2 }}>', '<DialogContent sx={{ mt: 2 }} ref={pdfRef}>');

// Add button to DialogActions
if (!dialogCode.includes('handleDownloadPdf')) {
    const newActions = `<DialogActions sx={{ borderTop: '1px solid rgba(0,0,0,0.06)', p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={handleDownloadPdf} disabled={isExporting} startIcon={isExporting ? <CircularProgress size={16} /> : <PictureAsPdf />} sx={{ color: '#10b981', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' } }}>
          {isExporting ? 'Generating...' : 'Save as PDF'}
        </Button>
        <Button onClick={onClose} sx={{ color: '#111827' }}>Close</Button>
      </DialogActions>`;
    dialogCode = dialogCode.replace(
        /<DialogActions sx=\{\{ borderTop: '1px solid rgba\(0,0,0,0\.06\)', p: 2 \}\}>[\s\S]*?<\/DialogActions>/,
        newActions
    );
}

content = content.substring(0, dialogStart) + dialogCode + content.substring(dialogEnd);

fs.writeFileSync(filePath, content);
console.log('PDF Export feature added successfully!');

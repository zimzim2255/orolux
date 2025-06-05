// Helper functions for PDF generation
class OrderPDFGenerator {
    constructor(pdf) {
        this.pdf = pdf;
        this.pageWidth = pdf.internal.pageSize.width;
        this.pageHeight = pdf.internal.pageSize.height;
        this.margins = {
            top: 80,
            bottom: 80,
            left: 40,
            right: 40
        };
        this.colors = {
            primary: [31, 43, 77],    // Rich blue
            secondary: [42, 60, 104],  // Lighter blue
            background: [248, 250, 255]
        };
    }

    addPageNumber(currentPage, totalPages) {
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(...this.colors.secondary);
        this.pdf.text(
            `Page ${currentPage} of ${totalPages}`, 
            this.pageWidth - 100, 
            this.pageHeight - 25
        );
    }

    addHeader() {
        this.pdf.setFillColor(...this.colors.background);
        this.pdf.rect(0, 0, this.pageWidth, 60, 'F');
        this.pdf.setDrawColor(...this.colors.primary, 0.1);
        this.pdf.setLineWidth(0.5);
        this.pdf.line(0, 60, this.pageWidth, 60);
    }

    addFooter(currentPage, totalPages) {
        this.pdf.setFillColor(...this.colors.background);
        this.pdf.rect(0, this.pageHeight - 80, this.pageWidth, 80, 'F');
        
        this.pdf.setFontSize(12);
        this.pdf.setTextColor(...this.colors.primary);
        this.pdf.text('Thank you for your business!', 40, this.pageHeight - 45);
        
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(...this.colors.secondary);
        this.pdf.text(`Generated on ${new Date().toLocaleString()}`, 40, this.pageHeight - 25);
        
        this.addPageNumber(currentPage, totalPages);
    }

    addSection(title, content, startY) {
        this.pdf.setFontSize(18);
        this.pdf.setTextColor(...this.colors.primary);
        let sectionTitle = title;
        if (title === 'Customer Information') {
            sectionTitle += ' (Orlux)';
        }
        this.pdf.text(sectionTitle, this.margins.left, startY);
        startY += 15;

        this.pdf.setFontSize(12);
        this.pdf.setTextColor(...this.colors.secondary);
        const lines = content.split('\n');
        lines.forEach(line => {
            if (startY > this.pageHeight - this.margins.bottom) {
                this.pdf.addPage();
                this.addHeader();
                startY = this.margins.top;
            }
            this.pdf.text(line.trim(), this.margins.left, startY);
            startY += 16; // Increased line spacing for clarity
        });

        return startY;
    }

    addOrderTitle(orderId, startY) {
        this.pdf.setFontSize(32);
        this.pdf.setTextColor(...this.colors.primary);
        const orderTitle = `Order #${orderId}`;
        const titleWidth = this.pdf.getStringUnitWidth(orderTitle) * 32;
        const centerX = (this.pageWidth - titleWidth) / 2;
        this.pdf.text(orderTitle, centerX, startY);

        startY += 10;
        this.pdf.setDrawColor(...this.colors.primary);
        this.pdf.setLineWidth(2);
        this.pdf.line(40, startY, this.pageWidth - 40, startY);

        return startY;
    }

    addMetaInformation(date, status, startY) {
        this.pdf.setFontSize(12);
        this.pdf.setTextColor(...this.colors.secondary);
        
        this.pdf.setDrawColor(...this.colors.primary, 0.1);
        this.pdf.setFillColor(...this.colors.background);
        this.pdf.roundedRect(40, startY, this.pageWidth - 80, 60, 3, 3, 'FD');
        
        startY += 25;
        this.pdf.text(`Date: ${date}`, 60, startY);
        startY += 20;
        this.pdf.text(`Status: ${status}`, 60, startY);
        
        return startY + 40;
    }

    addProductsTable(products, startY) {
        const tableLeft = this.margins.left;
        const tableWidth = this.pageWidth - this.margins.left - this.margins.right;

        // Table header
        this.pdf.setFontSize(16);
        this.pdf.setTextColor(...this.colors.primary);
        this.pdf.text('Products', tableLeft, startY);
        startY += 20;

        this.pdf.setFillColor(...this.colors.primary);
        this.pdf.rect(tableLeft, startY, tableWidth, 30, 'F');
        startY += 20;

        // Column headers
        this.pdf.setFontSize(12);
        this.pdf.setTextColor(255, 255, 255);
        this.pdf.text('Product', tableLeft + 20, startY);
        this.pdf.text('Quantity', tableLeft + 310, startY);
        this.pdf.text('Price', tableLeft + 410, startY);
        startY += 25;

        // Product rows
        products.forEach((product, index) => {
            if (startY > this.pageHeight - this.margins.bottom) {
                this.pdf.addPage();
                this.addHeader();
                startY = this.margins.top;
            }

            if (index % 2 === 0) {
                this.pdf.setFillColor(...this.colors.background);
                this.pdf.rect(tableLeft, startY - 15, tableWidth, 30, 'F');
            }

            this.pdf.setTextColor(...this.colors.secondary);
            this.pdf.text(product.name, tableLeft + 20, startY, { maxWidth: 280 });
            this.pdf.text(product.quantity, tableLeft + 310, startY);
            this.pdf.setFont('helvetica', 'bold');
            this.pdf.text(product.price, tableLeft + 410, startY);
            this.pdf.setFont('helvetica', 'normal');
            startY += 30;
        });

        return startY;
    }

    addTotal(total, startY) {
        startY += 20;
        this.pdf.setFillColor(...this.colors.primary);
        this.pdf.roundedRect(this.pageWidth - 250, startY - 15, 210, 40, 3, 3, 'F');
        
        this.pdf.setFontSize(14);
        this.pdf.setTextColor(255, 255, 255);
        this.pdf.text('Total:', this.pageWidth - 230, startY + 5);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(total, this.pageWidth - 100, startY + 5);
        this.pdf.setFont('helvetica', 'normal');

        return startY;
    }
}

// Main print function
async function generateOrderPDF(orderId) {
  try {
    // Get order row from table
    const orderRow = document.querySelector(`tr[data-order-id="${orderId}"]`);
    if (!orderRow) throw new Error('Order not found');

    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set fonts and colors
    doc.setFont('helvetica');
    doc.setTextColor(10, 36, 64); // deep blue

    // Add header
    doc.setFontSize(24);
    doc.text('OROLUX', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Order Details', 105, 30, { align: 'center' });

    // Add order info
    doc.setFontSize(12);
    doc.text(`Order ID: ${orderId}`, 20, 50);
    doc.text(`Date: ${orderRow.querySelector('td:nth-child(7)').textContent}`, 20, 60);
    doc.text(`Status: ${orderRow.querySelector('.status-badge').textContent}`, 20, 70);

    // Add customer info
    const customerInfo = orderRow.querySelector('td:nth-child(2)').textContent.split('\n');
    doc.text('Customer Information:', 20, 90);
    doc.setFontSize(10);
    customerInfo.forEach((line, index) => {
      doc.text(line.trim(), 20, 100 + (index * 10));
    });

    // Add delivery info
    const deliveryInfo = orderRow.querySelector('td:nth-child(4)').textContent.split('\n');
    doc.setFontSize(12);
    doc.text('Delivery Information:', 20, 130);
    doc.setFontSize(10);
    deliveryInfo.forEach((line, index) => {
      doc.text(line.trim(), 20, 140 + (index * 10));
    });

    // Add products table header
    doc.setFontSize(12);
    doc.text('Products:', 20, 180);

    // Table column positions
    const col1 = 20;   // Product Name
    const col2 = 120;  // Quantity
    const col3 = 170;  // Price
    let yPos = 195;

    // Draw table headers
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Product', col1, yPos);
    doc.text('Quantity', col2, yPos);
    doc.text('Price', col3, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 8;

    // Draw a line under headers
    doc.setLineWidth(0.3);
    doc.line(col1, yPos, col3 + 40, yPos);
    yPos += 5;

    // Table rows
    const products = orderRow.querySelectorAll('.product-item');
    products.forEach((product, idx) => {
      // Add new page if needed
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      const name = product.querySelector('.product-name').textContent.trim();
      const quantity = product.querySelector('.product-quantity').textContent.trim();
      const price = product.querySelector('.product-total-price').textContent.trim();

      doc.setFontSize(10);
      doc.text(name, col1, yPos);
      doc.text(quantity, col2, yPos);
      doc.text(price, col3, yPos);
      yPos += 8;
    });

    // Add total after the table, on a new page if needed
    if (yPos > 260) {
      doc.addPage();
      yPos = 30;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const total = orderRow.querySelector('td:nth-child(5)').textContent;
    doc.text('Total:', col2, yPos + 15);
    doc.text(total, col3, yPos + 15);

    // Save the PDF
    doc.save(`OROLUX-Order-${orderId}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error generating PDF. Please try again.');
  }
}

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StockApiService } from '../../services/stock-api.service';

interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
  visible: boolean;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class FileUploadComponent {

  selectedFile?: File | null;

  loading = false;

  toasts: Toast[] = [];

  constructor(
    private stockApiService: StockApiService,
    private router: Router
  ) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  filterFile() {
    if (!this.selectedFile) {
      this.showToast('Please select a file', 'error');
      return;
    }

    this.loading = true;

    this.stockApiService
      .uploadExcel(this.selectedFile)
      .subscribe({
        next: (response: Blob) => {
          const blob = new Blob(
            [response],
            {
              type:
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
          );

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'filtered_output.xlsx';
          link.click();

          // give the browser a moment to start the download before hiding the loader
          setTimeout(() => {
            try {
              window.URL.revokeObjectURL(url);
            } catch (e) {
              // ignore revoke errors
            }

            this.loading = false;
            this.selectedFile = null;

            const inputEl = document.getElementById('fileInput') as HTMLInputElement | null;
            if (inputEl) {
              try { inputEl.value = ''; } catch (e) { /* ignore */ }
            }

            this.router.navigate(['/success']);
          }, 250);
        },
        error: (error) => {
          this.loading = false;
          this.showToast('Error processing file. Please try again.', 'error');
        }
      });
  }

  showToast(message: string, type: 'success' | 'error') {
    const id = Date.now().toString();
    const toast: Toast = {
      id,
      type,
      message,
      visible: true
    };

    this.toasts.push(toast);

    // Auto remove toast after 5 seconds
    setTimeout(() => {
      this.removeToast(id);
    }, 5000);
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }
}
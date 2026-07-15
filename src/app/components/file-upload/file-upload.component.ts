import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
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

  selectedStockFile?: File | null;
  selectedBiblicalFile?: File | null;

  loading = false;

  toasts: Toast[] = [];

  constructor(
    private stockApiService: StockApiService,
    private router: Router
  ) {}

  onStockFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    this.selectedStockFile = input?.files?.[0] ?? null;
  }

  onBiblicalFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    this.selectedBiblicalFile = input?.files?.[0] ?? null;
  }

  filterFile() {
    if (!this.selectedStockFile) {
      this.showToast('Please select the Stock Excel file before submitting.', 'error');
      return;
    }

    if (!this.selectedBiblicalFile) {
      this.showToast('Please select the Biblical Screening Excel file before submitting.', 'error');
      return;
    }

    this.loading = true;

    this.stockApiService
      .uploadExcel(this.selectedStockFile, this.selectedBiblicalFile)
      .subscribe({
        next: (response: HttpResponse<Blob>) => {
          const blob = new Blob([response.body as Blob], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = this.getDownloadFileName(response) ?? 'filtered_output.xlsx';
          link.click();

          setTimeout(() => {
            try {
              window.URL.revokeObjectURL(url);
            } catch (e) {
              // ignore revoke errors
            }

            this.loading = false;
            this.selectedStockFile = null;
            this.selectedBiblicalFile = null;

            const stockInputEl = document.getElementById('stockFileInput') as HTMLInputElement | null;
            if (stockInputEl) {
              try { stockInputEl.value = ''; } catch (e) { /* ignore */ }
            }

            const biblicalInputEl = document.getElementById('biblicalFileInput') as HTMLInputElement | null;
            if (biblicalInputEl) {
              try { biblicalInputEl.value = ''; } catch (e) { /* ignore */ }
            }

            this.router.navigate(['/success']);
          }, 250);
        },
        error: () => {
          this.loading = false;
          this.showToast('Error processing files. Please try again.', 'error');
        }
      });
  }

  private getDownloadFileName(response: HttpResponse<Blob>): string | null {
    const contentDisposition = response.headers.get('content-disposition') ?? '';
    const utf8FilenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);

    if (utf8FilenameMatch?.[1]) {
      return decodeURIComponent(utf8FilenameMatch[1]);
    }

    const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    return filenameMatch?.[1]?.trim() ?? null;
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
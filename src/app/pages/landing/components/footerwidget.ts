import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-footer-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="py-20 px-6 border-t border-surface-200 dark:border-surface-800">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
          <div class="col-span-1 md:col-span-1">
            <div class="flex items-center gap-3 mb-6">
              <div
                class="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white"
              >
                <i class="pi pi-table"></i>
              </div>
              <span class="text-xl font-black tracking-tighter">Keep Quality</span>
            </div>
            <p class="text-surface-500 leading-relaxed">
              The standard in compliant data management for regulated industries.
            </p>
          </div>
          <div>
            <h5 class="font-bold text-surface-900 dark:text-white mb-6">Product</h5>
            <ul class="flex flex-col gap-4 text-surface-500">
              <li><a href="#" class="hover:text-primary-500 transition-colors">Features</a></li>
              <li><a href="#" class="hover:text-primary-500 transition-colors">Pricing</a></li>
              <li><a href="#" class="hover:text-primary-500 transition-colors">Security</a></li>
              <li>
                <a href="#" class="hover:text-primary-500 transition-colors">Validation Services</a>
              </li>
            </ul>
          </div>
          <div>
            <h5 class="font-bold text-surface-900 dark:text-white mb-6">Resources</h5>
            <ul class="flex flex-col gap-4 text-surface-500">
              <li>
                <a href="#" class="hover:text-primary-500 transition-colors">Documentation</a>
              </li>
              <li><a href="#" class="hover:text-primary-500 transition-colors">GxP Guides</a></li>
              <li>
                <a href="#" class="hover:text-primary-500 transition-colors">API Reference</a>
              </li>
              <li>
                <a href="#" class="hover:text-primary-500 transition-colors">Lab Templates</a>
              </li>
            </ul>
          </div>
          <div>
            <h5 class="font-bold text-surface-900 dark:text-white mb-6">Company</h5>
            <ul class="flex flex-col gap-4 text-surface-500">
              <li><a href="#" class="hover:text-primary-500 transition-colors">About</a></li>
              <li><a href="#" class="hover:text-primary-500 transition-colors">Customers</a></li>
              <li>
                <a href="#" class="hover:text-primary-500 transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" class="hover:text-primary-500 transition-colors">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>
        <div
          class="pt-8 border-t border-surface-200 dark:border-surface-800 flex flex-col md:flex-row justify-between items-center gap-6 text-surface-500 text-sm"
        >
          <p>© 2026 Keep Quality by Esteban CSi. All rights reserved.</p>
          <div class="flex gap-6">
            <a href="#" class="hover:text-surface-900 dark:hover:text-white transition-colors"
              >Twitter</a
            >
            <a href="#" class="hover:text-surface-900 dark:hover:text-white transition-colors"
              >LinkedIn</a
            >
            <a
              href="https://github.com/estebancsi/keep-quality-app"
              class="hover:text-surface-900 dark:hover:text-white transition-colors"
              >GitHub</a
            >
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class FooterWidget {}

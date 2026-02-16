import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, input, computed } from '@angular/core';

/**
 * LazyImageWidget provides an optimized image loading experience using NgOptimizedImage.
 * It features a smooth fade-in animation once the image has fully loaded.
 */
@Component({
  selector: 'app-lazy-image-widget',
  imports: [NgOptimizedImage],
  template: `
    <img
      [ngSrc]="src()"
      [alt]="alt()"
      [class.opacity-0]="!isLoaded()"
      class="transition-opacity duration-700 ease-out delay-75 w-full h-full object-cover"
      (load)="isLoaded.set(true)"
      [fill]="useFill()"
      [width]="width()!"
      [height]="height()!"
      [priority]="priority()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.relative]': 'useFill()',
    '[class.block]': 'true',
    '[class]': 'className()',
  },
})
export class LazyImageWidget {
  /** The source URL of the image. */
  src = input.required<string>();

  /** Alternative text for the image. */
  alt = input<string>('');

  /** CSS classes to apply to the host container (e.g., dimensions like 'w-64 h-64'). */
  className = input<string>('');

  /** Optional width in pixels. If omitted and no height is provided, 'fill' mode is used. */
  width = input<number | string>();

  /** Optional height in pixels. If omitted and no width is provided, 'fill' mode is used. */
  height = input<number | string>();

  /** Whether the image should be prioritized for loading. */
  priority = input<boolean>(false);

  /** Internal state to track when the image is fully loaded. */
  protected readonly isLoaded = signal(false);

  /** Computes if the image should use the 'fill' strategy. */
  protected readonly useFill = computed(() => !this.width() || !this.height());
}

import { Component } from '@angular/core';

interface FruitTag { emoji: string; name: string; origin: string; }

@Component({
  selector: 'app-marquee-section',
  standalone: true,
  template: `
    <section class="marquee-section">
      <div class="marquee-label">Fresh arrivals · Every day</div>

      <!-- Row 1: left to right -->
      <div class="marquee-track-wrap" (mouseenter)="pauseRow1=true" (mouseleave)="pauseRow1=false">
        <div class="marquee-track" [class.paused]="pauseRow1">
          <!-- Duplicate content for seamless loop -->
          @for (f of row1; track f.name + 'a') {
            <div class="fruit-tag">
              <span class="fruit-tag-emoji">{{ f.emoji }}</span>
              <span class="fruit-tag-name">{{ f.name }}</span>
              <span class="fruit-tag-origin">{{ f.origin }}</span>
            </div>
          }
          @for (f of row1; track f.name + 'b') {
            <div class="fruit-tag" aria-hidden="true">
              <span class="fruit-tag-emoji">{{ f.emoji }}</span>
              <span class="fruit-tag-name">{{ f.name }}</span>
              <span class="fruit-tag-origin">{{ f.origin }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Row 2: right to left -->
      <div class="marquee-track-wrap" (mouseenter)="pauseRow2=true" (mouseleave)="pauseRow2=false">
        <div class="marquee-track marquee-rtl" [class.paused]="pauseRow2">
          @for (f of row2; track f.name + 'a') {
            <div class="fruit-tag fruit-tag-alt">
              <span class="fruit-tag-emoji">{{ f.emoji }}</span>
              <span class="fruit-tag-name">{{ f.name }}</span>
              <span class="fruit-tag-origin">{{ f.origin }}</span>
            </div>
          }
          @for (f of row2; track f.name + 'b') {
            <div class="fruit-tag fruit-tag-alt" aria-hidden="true">
              <span class="fruit-tag-emoji">{{ f.emoji }}</span>
              <span class="fruit-tag-name">{{ f.name }}</span>
              <span class="fruit-tag-origin">{{ f.origin }}</span>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './marquee-section.scss',
})
export class MarqueeSectionComponent {
  pauseRow1 = false;
  pauseRow2 = false;

  row1: FruitTag[] = [
    { emoji: '🍋', name: 'Meyer Lemon',       origin: '🇮🇳 India'   },
    { emoji: '🥭', name: 'Alphonso Mango',    origin: '🇮🇳 India'   },
    { emoji: '🍎', name: 'Fuji Apple',        origin: '🇳🇵 Nepal'   },
    { emoji: '🍇', name: 'Muscat Grapes',     origin: '🇮🇳 India'   },
    { emoji: '🍊', name: 'Blood Orange',      origin: '🇳🇵 Nepal'   },
    { emoji: '🥝', name: 'Zespri Kiwi',       origin: '🇳🇿 NZ'      },
    { emoji: '🍑', name: 'White Peach',       origin: '🇨🇳 China'   },
    { emoji: '🍓', name: 'Garden Strawberry', origin: '🇳🇵 Nepal'   },
    { emoji: '🍈', name: 'Honeydew Melon',    origin: '🇮🇳 India'   },
    { emoji: '🫐', name: 'Wild Blueberry',    origin: '🇺🇸 USA'     },
  ];

  row2: FruitTag[] = [
    { emoji: '🍍', name: 'Gold Pineapple',    origin: '🇱🇰 Sri Lanka' },
    { emoji: '🥥', name: 'Young Coconut',     origin: '🇱🇰 Sri Lanka' },
    { emoji: '🍌', name: 'Cavendish Banana',  origin: '🇳🇵 Nepal'     },
    { emoji: '🍈', name: 'Galia Melon',       origin: '🇮🇳 India'     },
    { emoji: '🍒', name: 'Rainier Cherry',    origin: '🇺🇸 USA'       },
    { emoji: '🥭', name: 'Chaunsa Mango',     origin: '🇵🇰 Pakistan'  },
    { emoji: '🍏', name: 'Granny Smith Apple',origin: '🇦🇺 Australia' },
    { emoji: '🫒', name: 'Castelvetrano Olive',origin:'🇮🇹 Italy'    },
    { emoji: '🍊', name: 'Nagpur Orange',     origin: '🇮🇳 India'     },
    { emoji: '🍋', name: 'Eureka Lemon',      origin: '🇺🇸 USA'       },
  ];
}

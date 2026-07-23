import { Component } from '@angular/core';

interface FruitTag { emoji: string; name: string; origin: string; }

@Component({
  selector: 'app-marquee-section',
  standalone: true,
  templateUrl: './marquee-section.html',
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

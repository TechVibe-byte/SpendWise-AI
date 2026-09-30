
import React from 'react';
import { DefaultCategory, CategoryItem } from './types';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat_food', name: DefaultCategory.FOOD, color: '#FF6B6B', isCustom: false },
  { id: 'cat_transport', name: DefaultCategory.TRANSPORT, color: '#4D96FF', isCustom: false },
  { id: 'cat_shopping', name: DefaultCategory.SHOPPING, color: '#FFC93C', isCustom: false },
  { id: 'cat_entertainment', name: DefaultCategory.ENTERTAINMENT, color: '#A66CFF', isCustom: false },
  { id: 'cat_bills', name: DefaultCategory.BILLS, color: '#2DD4BF', isCustom: false },
  { id: 'cat_health', name: DefaultCategory.HEALTH, color: '#FF7AA2', isCustom: false },
  { id: 'cat_loan', name: DefaultCategory.LOAN, color: '#64748B', isCustom: false },
  { id: 'cat_emi', name: DefaultCategory.EMI, color: '#818CF8', isCustom: false },
  { id: 'cat_borrow', name: DefaultCategory.BORROW, color: '#F97316', isCustom: false },
  { id: 'cat_other', name: DefaultCategory.OTHER, color: '#94A3B8', isCustom: false },
];

export interface IconPreset {
  emoji: string;
  label: string;
  categoryGroup: string;
}

export const CATEGORY_ICON_LIBRARY: IconPreset[] = [
  // 🐾 Pets & Animals (10+)
  { emoji: '🐾', label: 'Pet Paw', categoryGroup: 'Pets' },
  { emoji: '🐶', label: 'Dog', categoryGroup: 'Pets' },
  { emoji: '🐱', label: 'Cat', categoryGroup: 'Pets' },
  { emoji: '🦴', label: 'Pet Food / Bone', categoryGroup: 'Pets' },
  { emoji: '🐟', label: 'Fish', categoryGroup: 'Pets' },
  { emoji: '🦜', label: 'Bird', categoryGroup: 'Pets' },
  { emoji: '🐹', label: 'Hamster', categoryGroup: 'Pets' },
  { emoji: '🐰', label: 'Rabbit', categoryGroup: 'Pets' },
  { emoji: '🐢', label: 'Turtle', categoryGroup: 'Pets' },
  { emoji: '🐴', label: 'Horse', categoryGroup: 'Pets' },

  // 🍕 Food & Dining (15+)
  { emoji: '🍕', label: 'Pizza', categoryGroup: 'Food & Dining' },
  { emoji: '🍔', label: 'Burger', categoryGroup: 'Food & Dining' },
  { emoji: '☕', label: 'Coffee / Tea', categoryGroup: 'Food & Dining' },
  { emoji: '🍺', label: 'Beer / Bar', categoryGroup: 'Food & Dining' },
  { emoji: '🍷', label: 'Wine', categoryGroup: 'Food & Dining' },
  { emoji: '🍩', label: 'Donut / Sweets', categoryGroup: 'Food & Dining' },
  { emoji: '🍣', label: 'Sushi', categoryGroup: 'Food & Dining' },
  { emoji: '🌮', label: 'Taco / Mexican', categoryGroup: 'Food & Dining' },
  { emoji: '🍜', label: 'Noodles / Ramen', categoryGroup: 'Food & Dining' },
  { emoji: '🍦', label: 'Ice Cream', categoryGroup: 'Food & Dining' },
  { emoji: '🍰', label: 'Cake / Bakery', categoryGroup: 'Food & Dining' },
  { emoji: '🥗', label: 'Salad / Healthy', categoryGroup: 'Food & Dining' },
  { emoji: '🍟', label: 'Fast Food', categoryGroup: 'Food & Dining' },
  { emoji: '🍱', label: 'Bento / Dinner', categoryGroup: 'Food & Dining' },
  { emoji: '🍹', label: 'Cocktail', categoryGroup: 'Food & Dining' },

  // 🛒 Groceries (10+)
  { emoji: '🛒', label: 'Shopping Cart', categoryGroup: 'Groceries' },
  { emoji: '🛍️', label: 'Shopping Bags', categoryGroup: 'Groceries' },
  { emoji: '🥦', label: 'Vegetables', categoryGroup: 'Groceries' },
  { emoji: '🍎', label: 'Fruits', categoryGroup: 'Groceries' },
  { emoji: '🍞', label: 'Bread / Bakery', categoryGroup: 'Groceries' },
  { emoji: '🥛', label: 'Milk / Dairy', categoryGroup: 'Groceries' },
  { emoji: '🥩', label: 'Meat', categoryGroup: 'Groceries' },
  { emoji: '🥚', label: 'Eggs', categoryGroup: 'Groceries' },
  { emoji: '🧀', label: 'Cheese', categoryGroup: 'Groceries' },

  // 🚗 Transport & Fuel (12+)
  { emoji: '🚗', label: 'Car', categoryGroup: 'Transport' },
  { emoji: '⛽', label: 'Fuel / Gas', categoryGroup: 'Transport' },
  { emoji: '🚕', label: 'Taxi / Cab', categoryGroup: 'Transport' },
  { emoji: '🚌', label: 'Bus', categoryGroup: 'Transport' },
  { emoji: '🚆', label: 'Train / Metro', categoryGroup: 'Transport' },
  { emoji: '🏍️', label: 'Motorbike / Scooter', categoryGroup: 'Transport' },
  { emoji: '🚲', label: 'Bicycle', categoryGroup: 'Transport' },
  { emoji: '🅿️', label: 'Parking', categoryGroup: 'Transport' },
  { emoji: '🔧', label: 'Car Service', categoryGroup: 'Transport' },
  { emoji: '🧼', label: 'Car Wash', categoryGroup: 'Transport' },
  { emoji: '🎫', label: 'Transit Ticket', categoryGroup: 'Transport' },

  // 🏠 Housing & Utilities (12+)
  { emoji: '🏠', label: 'House / Rent', categoryGroup: 'Housing' },
  { emoji: '💡', label: 'Electricity / Light', categoryGroup: 'Housing' },
  { emoji: '💧', label: 'Water Bill', categoryGroup: 'Housing' },
  { emoji: '🔌', label: 'Power / Utilities', categoryGroup: 'Housing' },
  { emoji: '📶', label: 'Wifi / Internet', categoryGroup: 'Housing' },
  { emoji: '🧹', label: 'Cleaning / Maid', categoryGroup: 'Housing' },
  { emoji: '🛋️', label: 'Furniture', categoryGroup: 'Housing' },
  { emoji: '🔑', label: 'Rent / Keys', categoryGroup: 'Housing' },
  { emoji: '🛡️', label: 'Home Security', categoryGroup: 'Housing' },
  { emoji: '🗑️', label: 'Waste Disposal', categoryGroup: 'Housing' },

  // 🎬 Entertainment & Tech (15+)
  { emoji: '🎬', label: 'Movies / Netflix', categoryGroup: 'Entertainment' },
  { emoji: '🎮', label: 'Gaming / Console', categoryGroup: 'Entertainment' },
  { emoji: '🎵', label: 'Music / Spotify', categoryGroup: 'Entertainment' },
  { emoji: '🍿', label: 'Cinema / Popcorn', categoryGroup: 'Entertainment' },
  { emoji: '🎧', label: 'Headphones', categoryGroup: 'Entertainment' },
  { emoji: '💻', label: 'Laptop / Tech', categoryGroup: 'Entertainment' },
  { emoji: '📱', label: 'Mobile / Phone', categoryGroup: 'Entertainment' },
  { emoji: '📺', label: 'TV / Cable', categoryGroup: 'Entertainment' },
  { emoji: '🎟️', label: 'Concert / Events', categoryGroup: 'Entertainment' },
  { emoji: '🎲', label: 'Board Games / Hobbies', categoryGroup: 'Entertainment' },
  { emoji: '📸', label: 'Camera / Photo', categoryGroup: 'Entertainment' },

  // 🏋️ Health & Fitness (12+)
  { emoji: '🏥', label: 'Hospital / Clinic', categoryGroup: 'Health' },
  { emoji: '💊', label: 'Pharmacy / Medicine', categoryGroup: 'Health' },
  { emoji: '🏋️', label: 'Gym / Workout', categoryGroup: 'Health' },
  { emoji: '🧘', label: 'Yoga / Meditation', categoryGroup: 'Health' },
  { emoji: '🩺', label: 'Doctor', categoryGroup: 'Health' },
  { emoji: '👓', label: 'Eye Care / Glasses', categoryGroup: 'Health' },
  { emoji: '🦷', label: 'Dental', categoryGroup: 'Health' },
  { emoji: '💇', label: 'Salon / Haircut', categoryGroup: 'Health' },
  { emoji: '💅', label: 'Spa / Beauty', categoryGroup: 'Health' },
  { emoji: '💈', label: 'Barber', categoryGroup: 'Health' },

  // 🎓 Education & Work (10+)
  { emoji: '🎓', label: 'Education / Graduation', categoryGroup: 'Education' },
  { emoji: '📚', label: 'Books / Reading', categoryGroup: 'Education' },
  { emoji: '✏️', label: 'Stationery', categoryGroup: 'Education' },
  { emoji: '🎒', label: 'School / College', categoryGroup: 'Education' },
  { emoji: '💼', label: 'Work / Office', categoryGroup: 'Education' },
  { emoji: '📝', label: 'Courses / Exam', categoryGroup: 'Education' },

  // ✈️ Travel & Vacation (10+)
  { emoji: '✈️', label: 'Flight / Airline', categoryGroup: 'Travel' },
  { emoji: '🏨', label: 'Hotel / Resort', categoryGroup: 'Travel' },
  { emoji: '🌴', label: 'Vacation / Beach', categoryGroup: 'Travel' },
  { emoji: '🧳', label: 'Luggage / Baggage', categoryGroup: 'Travel' },
  { emoji: '🗺️', label: 'Tourism / Map', categoryGroup: 'Travel' },
  { emoji: '🗿', label: 'Sightseeing', categoryGroup: 'Travel' },

  // 🧸 Family & Kids (8+)
  { emoji: '🧸', label: 'Toys / Kids', categoryGroup: 'Family' },
  { emoji: '👶', label: 'Baby / Childcare', categoryGroup: 'Family' },
  { emoji: '🍼', label: 'Baby Bottle', categoryGroup: 'Family' },
  { emoji: '🎁', label: 'Gifts / Presents', categoryGroup: 'Family' },
  { emoji: '🎂', label: 'Birthday', categoryGroup: 'Family' },

  // 💰 Finance & Income (15+)
  { emoji: '💰', label: 'Money / Salary', categoryGroup: 'Finance' },
  { emoji: '💳', label: 'Credit Card / EMI', categoryGroup: 'Finance' },
  { emoji: '🏦', label: 'Bank / Savings', categoryGroup: 'Finance' },
  { emoji: '📈', label: 'Investments / Stocks', categoryGroup: 'Finance' },
  { emoji: '🪙', label: 'Crypto / Coins', categoryGroup: 'Finance' },
  { emoji: '📄', label: 'Bills / Invoices', categoryGroup: 'Finance' },
  { emoji: '🧾', label: 'Receipt / Refund', categoryGroup: 'Finance' },
  { emoji: '💵', label: 'Cash / Income', categoryGroup: 'Finance' },
  { emoji: '🏛️', label: 'Taxes / Government', categoryGroup: 'Finance' },
  { emoji: '🤝', label: 'Borrow / Lend', categoryGroup: 'Finance' },
  { emoji: '🤲', label: 'Charity / Donation', categoryGroup: 'Finance' },

  // 🌟 Misc & Services (10+)
  { emoji: '🧺', label: 'Laundry / Dry Cleaning', categoryGroup: 'Misc' },
  { emoji: '📦', label: 'Delivery / Courier', categoryGroup: 'Misc' },
  { emoji: '⚡', label: 'Quick Pay', categoryGroup: 'Misc' },
  { emoji: '⭐', label: 'Star / Priority', categoryGroup: 'Misc' },
  { emoji: '🎉', label: 'Party / Celebration', categoryGroup: 'Misc' },
  { emoji: '❓', label: 'Other', categoryGroup: 'Misc' },
];

const KEYWORD_ICON_MAP: { keywords: string[]; emoji: string }[] = [
  // Pets
  { keywords: ['pet', 'dog', 'cat', 'vet', 'animal', 'puppy', 'kitten', 'aquarium', 'grooming', 'kennel', 'furry'], emoji: '🐾' },
  
  // Food & Dining
  { keywords: ['coffee', 'cafe', 'starbucks', 'espresso', 'cappuccino', 'tea'], emoji: '☕' },
  { keywords: ['pizza'], emoji: '🍕' },
  { keywords: ['burger', 'mcdonald', 'kfc', 'fast food'], emoji: '🍔' },
  { keywords: ['beer', 'pub', 'bar', 'alcohol', 'liquor'], emoji: '🍺' },
  { keywords: ['wine'], emoji: '🍷' },
  { keywords: ['sushi'], emoji: '🍣' },
  { keywords: ['ice cream', 'gelato', 'dessert'], emoji: '🍦' },
  { keywords: ['bakery', 'cake', 'pastry'], emoji: '🍰' },
  { keywords: ['food', 'dining', 'restaurant', 'dinner', 'lunch', 'breakfast', 'swiggy', 'zomato', 'eat'], emoji: '🍕' },

  // Groceries
  { keywords: ['grocery', 'groceries', 'supermarket', 'mart', 'blinkit', 'zepto', 'instamart', 'provisions'], emoji: '🛒' },
  { keywords: ['veg', 'vegetable', 'fruit'], emoji: '🥦' },
  { keywords: ['milk', 'dairy'], emoji: '🥛' },

  // Transport & Fuel
  { keywords: ['fuel', 'petrol', 'diesel', 'gas station', 'cng'], emoji: '⛽' },
  { keywords: ['car wash', 'wash'], emoji: '🧼' },
  { keywords: ['taxi', 'uber', 'cab', 'ola'], emoji: '🚕' },
  { keywords: ['bus'], emoji: '🚌' },
  { keywords: ['train', 'metro', 'railway'], emoji: '🚆' },
  { keywords: ['bike', 'motorcycle', 'scooter'], emoji: '🏍️' },
  { keywords: ['parking', 'toll'], emoji: '🅿️' },
  { keywords: ['transport', 'travel', 'commute', 'vehicle'], emoji: '🚗' },

  // Housing
  { keywords: ['rent', 'housing', 'mortgage', 'flat', 'apartment'], emoji: '🏠' },
  { keywords: ['electricity', 'power', 'current', 'light bill'], emoji: '💡' },
  { keywords: ['water', 'jal'], emoji: '💧' },
  { keywords: ['wifi', 'internet', 'broadband', 'fibernet'], emoji: '📶' },
  { keywords: ['maid', 'cook', 'cleaner', 'housekeeping'], emoji: '🧹' },

  // Entertainment
  { keywords: ['game', 'gaming', 'ps5', 'steam', 'xbox', 'nintendo', 'playstation'], emoji: '🎮' },
  { keywords: ['movie', 'cinema', 'netflix', 'prime', 'hotstar', 'theater'], emoji: '🎬' },
  { keywords: ['music', 'spotify', 'apple music', 'song'], emoji: '🎵' },
  { keywords: ['tv', 'cable', 'dth'], emoji: '📺' },
  { keywords: ['entertainment', 'show', 'event'], emoji: '🎟️' },

  // Health & Fitness
  { keywords: ['gym', 'fitness', 'workout', 'trainer', 'cult'], emoji: '🏋️' },
  { keywords: ['yoga', 'meditation'], emoji: '🧘' },
  { keywords: ['medicine', 'pharmacy', 'chemist', 'drug', 'apollo', 'pharmeasy'], emoji: '💊' },
  { keywords: ['doctor', 'clinic', 'hospital', 'medical', 'health', 'dentist'], emoji: '🏥' },
  { keywords: ['salon', 'parlour', 'haircut', 'barber', 'spa', 'beauty', 'makeup'], emoji: '💇' },

  // Education
  { keywords: ['school', 'college', 'tuition', 'fee', 'university', 'education'], emoji: '🎓' },
  { keywords: ['book', 'course', 'udemy', 'coursera', 'reading'], emoji: '📚' },

  // Travel
  { keywords: ['flight', 'air', 'airline', 'indigo', 'airasia'], emoji: '✈️' },
  { keywords: ['hotel', 'resort', 'stay', 'airbnb'], emoji: '🏨' },
  { keywords: ['vacation', 'trip', 'tour', 'holiday'], emoji: '🌴' },

  // Family & Kids
  { keywords: ['baby', 'kid', 'child', 'diaper', 'daycare'], emoji: '👶' },
  { keywords: ['toy', 'doll'], emoji: '🧸' },
  { keywords: ['gift', 'present', 'donation', 'charity'], emoji: '🎁' },

  // Finance & Income
  { keywords: ['salary', 'paycheck', 'wages', 'income', 'stipend'], emoji: '💰' },
  { keywords: ['tax', 'gst', 'income tax', 'tds'], emoji: '🏛️' },
  { keywords: ['crypto', 'bitcoin', 'eth'], emoji: '🪙' },
  { keywords: ['stock', 'investment', 'share', 'mutual fund', 'sip'], emoji: '📈' },
  { keywords: ['credit card', 'card fee'], emoji: '💳' },
  { keywords: ['emi', 'loan'], emoji: '📄' },
  { keywords: ['laundry', 'dry clean'], emoji: '🧺' },
];

export const getCategoryIcon = (categoryName: string, customIcon?: string): React.ReactNode => {
  if (customIcon) {
    return <span className="text-[18px] leading-none select-none flex items-center justify-center">{customIcon}</span>;
  }

  const normalized = categoryName.toLowerCase().trim();

  // Smart Keyword Match
  for (const item of KEYWORD_ICON_MAP) {
    if (item.keywords.some(kw => normalized.includes(kw))) {
      return <span className="text-[18px] leading-none select-none flex items-center justify-center">{item.emoji}</span>;
    }
  }

  const iconMap: Record<string, React.ReactNode> = {
    [DefaultCategory.FOOD]: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    [DefaultCategory.TRANSPORT]: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    [DefaultCategory.SHOPPING]: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    [DefaultCategory.ENTERTAINMENT]: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    [DefaultCategory.BILLS]: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    [DefaultCategory.HEALTH]: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    [DefaultCategory.LOAN]: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v20M12 14v20M16 14v20M3 21h18M3 10h18M3 7l9-4 9 4v3H3V7z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V10h18v9a2 2 0 01-2 2z" />
      </svg>
    ),
    [DefaultCategory.EMI]: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v4m0 0l-2-2m2 2l2-2" />
      </svg>
    ),
    [DefaultCategory.BORROW]: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    [DefaultCategory.OTHER]: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    ),
  };

  return iconMap[categoryName] || (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
};

// Comprehensive list of Indian Banks for general expenses (Bank / UPI / Debit / Net Banking)
export const INDIAN_BANKS = [
  // Top Public Sector Banks
  "State Bank of India (SBI)",
  "Punjab National Bank (PNB)",
  "Bank of Baroda (BOB)",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India",
  "Indian Bank",
  "Central Bank of India",
  "Indian Overseas Bank",
  "UCO Bank",
  "Bank of Maharashtra",
  "Punjab & Sind Bank",

  // Top Private Sector Banks
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "IDFC First Bank",
  "YES Bank",
  "Federal Bank",
  "South Indian Bank",
  "RBL Bank",
  "Bandhan Bank",
  "City Union Bank",
  "Karur Vysya Bank",
  "Karnataka Bank",
  "CSB Bank",
  "Tamilnad Mercantile Bank",
  "IDBI Bank",
  "Standard Chartered Bank",
  "HSBC India",
  "DBS Bank India",

  // Small Finance & Payments Banks
  "AU Small Finance Bank",
  "Equitas Small Finance Bank",
  "Ujjivan Small Finance Bank",
  "Jana Small Finance Bank",
  "ESAF Small Finance Bank",
  "Utkarsh Small Finance Bank",
  "Airtel Payments Bank",
  "Paytm Payments Bank",
  "India Post Payments Bank (IPPB)",
  "Jio Payments Bank",

  // Fintech & Neo-banks
  "Jupiter CSB / Federal",
  "Fi Federal Bank",
  "PayZapp / HDFC UPI",

  // Other
  "Cash",
  "Other Indian Bank"
];

// Comprehensive list of Indian Credit Card Issuers & Banks for Credit Card expenses
export const INDIAN_CREDIT_CARD_BANKS = [
  "HDFC Bank Credit Card",
  "SBI Card / State Bank of India",
  "ICICI Bank Credit Card",
  "Axis Bank Credit Card",
  "Kotak Mahindra Bank Credit Card",
  "IndusInd Bank Credit Card",
  "IDFC First Bank Credit Card",
  "RBL Bank Credit Card",
  "AU Small Finance Bank Credit Card",
  "Bank of Baroda (BOB Financial)",
  "Federal Bank Credit Card",
  "YES Bank Credit Card",
  "Standard Chartered Credit Card",
  "American Express India",
  "HSBC India Credit Card",
  "OneCard (Federal / BOB / SBM / CSB)",
  "Amazon Pay ICICI Card",
  "Flipkart Axis Bank Card",
  "Tata Neu HDFC RuPay Card",
  "Jupiter Edge CSB RuPay CC",
  "Scapia Federal Credit Card",
  "Slice Credit Card",
  "Punjab National Bank (PNB) Card",
  "Union Bank of India Card",
  "Canara Bank Credit Card",
  "Other Credit Card"
];


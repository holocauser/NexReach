import { BusinessCard, Provider, Referral } from '@/types';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export const mockCards: BusinessCard[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Dr. Sarah Johnson',
    title: 'Cardiologist',
    company: 'Atlanta Heart Institute',
    email: 'sarah.johnson@atlantaheart.com',
    phone: '(404) 555-0101',
    phones: [
      { label: 'Office', number: '(404) 555-0101' },
      { label: 'Mobile', number: '(404) 555-0102' }
    ],
    address: '1234 Peachtree St NE',
    addresses: [
      { label: 'Office', address: '1234 Peachtree St NE, Atlanta, GA 30309' },
      { label: 'Hospital', address: '5678 Piedmont Ave, Atlanta, GA 30305' }
    ],
    city: 'Atlanta',
    state: 'GA',
    zip: '30309',
    website: 'www.atlantaheart.com',
    notes: 'Specializes in interventional cardiology. Excellent bedside manner.',
    tags: ['Cardiology', 'Interventional', 'Highly Recommended', 'Experienced', 'Professional'],
    specialty: ['Cardiology', 'Interventional Cardiology', 'Heart Failure'],
    languages: ['English', 'Spanish'],
    favorited: true,
    lastContacted: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    profileImage: '',
    cardImage: '',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    updatedAt: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Michael Rodriguez, Esq.',
    title: 'Personal Injury Attorney',
    company: 'Rodriguez & Associates Law Firm',
    email: 'michael@rodriguezlaw.com',
    phone: '(404) 555-0201',
    phones: [
      { label: 'Office', number: '(404) 555-0201' },
      { label: 'Emergency', number: '(404) 555-0202' }
    ],
    address: '4567 Buckhead Ave',
    addresses: [
      { label: 'Office', address: '4567 Buckhead Ave, Atlanta, GA 30326' }
    ],
    city: 'Atlanta',
    state: 'GA',
    zip: '30326',
    website: 'www.rodriguezlaw.com',
    notes: 'Specializes in car accidents and medical malpractice. Contingency fee structure.',
    tags: ['Personal Injury', 'Car Accidents', 'Medical Malpractice', 'Contingency Fee', 'Bilingual Legal'],
    specialty: ['Personal Injury', 'Medical Malpractice', 'Car Accidents'],
    languages: ['English', 'Spanish'],
    favorited: false,
    lastContacted: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    profileImage: '',
    cardImage: '',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
    updatedAt: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Dr. Emily Chen',
    title: 'Neurologist',
    company: 'Emory Neurology Associates',
    email: 'emily.chen@emory.edu',
    phone: '(404) 555-0301',
    phones: [
      { label: 'Office', number: '(404) 555-0301' },
      { label: 'Pager', number: '(404) 555-0303' }
    ],
    address: '7890 Clifton Rd',
    addresses: [
      { label: 'Office', address: '7890 Clifton Rd, Atlanta, GA 30322' },
      { label: 'Hospital', address: '1364 Clifton Rd NE, Atlanta, GA 30322' }
    ],
    city: 'Atlanta',
    state: 'GA',
    zip: '30322',
    website: 'www.emoryhealthcare.org',
    notes: 'Specializes in movement disorders and Parkinson\'s disease. Research-focused.',
    tags: ['Neurology', 'Movement Disorders', 'Parkinson\'s', 'Research', 'Academic'],
    specialty: ['Neurology', 'Movement Disorders', 'Parkinson\'s Disease'],
    languages: ['English', 'Mandarin'],
    favorited: true,
    lastContacted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    profileImage: '',
    cardImage: '',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    updatedAt: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Jennifer Williams',
    title: 'Real Estate Agent',
    company: 'Buckhead Realty Group',
    email: 'jennifer@buckheadrealty.com',
    phone: '(404) 555-0401',
    phones: [
      { label: 'Office', number: '(404) 555-0401' },
      { label: 'Mobile', number: '(404) 555-0402' }
    ],
    address: '2345 Lenox Rd',
    addresses: [
      { label: 'Office', address: '2345 Lenox Rd, Atlanta, GA 30326' }
    ],
    city: 'Atlanta',
    state: 'GA',
    zip: '30326',
    website: 'www.buckheadrealty.com',
    notes: 'Specializes in luxury homes and investment properties. 15+ years experience.',
    tags: ['Real Estate', 'Luxury Homes', 'Investment Properties', 'Experienced', 'Reliable'],
    specialty: ['Luxury Real Estate', 'Investment Properties', 'Residential'],
    languages: ['English'],
    favorited: false,
    lastContacted: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
    profileImage: '',
    cardImage: '',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
    updatedAt: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Dr. Robert Thompson',
    title: 'Orthopedic Surgeon',
    company: 'Piedmont Orthopedics',
    email: 'rthompson@piedmont.org',
    phone: '(404) 555-0501',
    phones: [
      { label: 'Office', number: '(404) 555-0501' },
      { label: 'Surgery', number: '(404) 555-0502' }
    ],
    address: '3456 Peachtree Rd',
    addresses: [
      { label: 'Office', address: '3456 Peachtree Rd, Atlanta, GA 30305' },
      { label: 'Surgery Center', address: '5678 Peachtree Rd, Atlanta, GA 30305' }
    ],
    city: 'Atlanta',
    state: 'GA',
    zip: '30305',
    website: 'www.piedmont.org',
    notes: 'Specializes in sports medicine and joint replacement. Team physician for local sports teams.',
    tags: ['Orthopedics', 'Sports Medicine', 'Joint Replacement', 'Team Physician', 'Experienced'],
    specialty: ['Orthopedic Surgery', 'Sports Medicine', 'Joint Replacement'],
    languages: ['English'],
    favorited: true,
    lastContacted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    profileImage: '',
    cardImage: '',
    createdAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(), // 75 days ago
    updatedAt: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Lisa Martinez, CPA',
    title: 'Certified Public Accountant',
    company: 'Martinez & Associates CPA',
    email: 'lisa@martinezcpa.com',
    phone: '(404) 555-0601',
    phones: [
      { label: 'Office', number: '(404) 555-0601' },
      { label: 'Mobile', number: '(404) 555-0602' }
    ],
    address: '4567 Roswell Rd',
    addresses: [
      { label: 'Office', address: '4567 Roswell Rd, Atlanta, GA 30342' }
    ],
    city: 'Atlanta',
    state: 'GA',
    zip: '30342',
    website: 'www.martinezcpa.com',
    notes: 'Specializes in small business accounting and tax planning. QuickBooks certified.',
    tags: ['CPA', 'Small Business', 'Tax Planning', 'QuickBooks', 'Responsive'],
    specialty: ['Small Business Accounting', 'Tax Planning', 'Bookkeeping'],
    languages: ['English', 'Spanish'],
    favorited: false,
    lastContacted: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    profileImage: '',
    cardImage: '',
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), // 120 days ago
    updatedAt: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'Dr. David Kim',
    title: 'Dermatologist',
    company: 'Atlanta Dermatology Center',
    email: 'dkim@atlantaderm.com',
    phone: '(404) 555-0701',
    phones: [
      { label: 'Office', number: '(404) 555-0701' },
      { label: 'Emergency', number: '(404) 555-0702' }
    ],
    address: '6789 Northside Dr',
    addresses: [
      { label: 'Office', address: '6789 Northside Dr, Atlanta, GA 30327' }
    ],
    city: 'Atlanta',
    state: 'GA',
    zip: '30327',
    website: 'www.atlantaderm.com',
    notes: 'Specializes in skin cancer detection and cosmetic dermatology. Board certified.',
    tags: ['Dermatology', 'Skin Cancer', 'Cosmetic', 'Board Certified', 'Professional'],
    specialty: ['Dermatology', 'Skin Cancer Detection', 'Cosmetic Dermatology'],
    languages: ['English', 'Korean'],
    favorited: false,
    lastContacted: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), // 28 days ago
    profileImage: '',
    cardImage: '',
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(), // 150 days ago
    updatedAt: new Date().toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440008',
    name: 'Maria Gonzalez',
    title: 'Immigration Attorney',
    company: 'Gonzalez Immigration Law',
    email: 'maria@gonzalezimmigration.com',
    phone: '(404) 555-0801',
    phones: [
      { label: 'Office', number: '(404) 555-0801' },
      { label: 'Emergency', number: '(404) 555-0802' }
    ],
    address: '1234 Buford Hwy',
    addresses: [
      { label: 'Office', address: '1234 Buford Hwy, Atlanta, GA 30329' }
    ],
    city: 'Atlanta',
    state: 'GA',
    zip: '30329',
    website: 'www.gonzalezimmigration.com',
    notes: 'Specializes in family-based immigration and deportation defense. Free consultations.',
    tags: ['Immigration Legal', 'Family Law', 'Deportation Defense', 'Free Consultation', 'Bilingual Legal'],
    specialty: ['Immigration Law', 'Family-Based Immigration', 'Deportation Defense'],
    languages: ['English', 'Spanish'],
    favorited: true,
    lastContacted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    profileImage: '',
    cardImage: '',
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 180 days ago
    updatedAt: new Date().toISOString(),
  }
];

export const mockProviders: Provider[] = [
  {
    id: '101',
    name: 'Dr. Elizabeth Chen',
    company: 'Atlanta Neurology Associates',
    specialty: ['Neurology', 'Headache Medicine'],
    services: ['EMG/Nerve Conduction', 'Botox for Migraines', 'Telehealth'],
    languages: ['English', 'Mandarin'],
    address: '285 Boulevard NE, Atlanta, GA 30312',
    phone: '(555) 111-2233',
    email: 'echen@atlantaneuro.com',
    rating: 4.8,
    distance: 3.2
  },
  {
    id: '102',
    name: 'Dr. Robert Williams',
    company: 'Piedmont Orthopedics',
    specialty: ['Orthopedics', 'Sports Medicine', 'Joint Replacement'],
    services: ['Joint Replacement', 'Arthroscopy', 'PRP Therapy'],
    languages: ['English'],
    address: '1968 Peachtree Rd NW, Atlanta, GA 30309',
    phone: '(555) 222-3344',
    email: 'rwilliams@piedmontortho.com',
    rating: 4.6,
    distance: 5.1
  },
  {
    id: '103',
    name: 'Dr. Maria Gonzalez',
    company: 'Emory Family Medicine',
    specialty: ['Family Medicine', 'Preventive Care'],
    services: ['Annual Physicals', 'Vaccinations', 'Telehealth'],
    languages: ['English', 'Spanish'],
    address: '4555 North Shallowford Rd, Atlanta, GA 30338',
    phone: '(555) 333-4455',
    email: 'mgonzalez@emoryfm.com',
    rating: 4.9,
    distance: 7.8
  },
  {
    id: '104',
    name: 'Thomas Rodriguez, Esq.',
    company: 'Rodriguez & Partners',
    specialty: ['Immigration Law', 'Family Law'],
    services: ['Visa Applications', 'Green Cards', 'Deportation Defense'],
    languages: ['English', 'Spanish'],
    address: '1201 West Peachtree St NW, Atlanta, GA 30309',
    phone: '(555) 444-5566',
    email: 'trodriguez@rodriguezlaw.com',
    rating: 4.7,
    distance: 2.5
  },
  {
    id: '105',
    name: 'Rebecca Miller, Esq.',
    company: 'Miller Tax Group',
    specialty: ['Tax Law', 'Estate Planning'],
    services: ['Tax Planning', 'Wills & Trusts', 'Business Taxation'],
    languages: ['English'],
    address: '3344 Peachtree Rd NE, Atlanta, GA 30326',
    phone: '(555) 555-6677',
    email: 'rmiller@millertax.com',
    rating: 4.5,
    distance: 6.3
  }
];

export const mockReferrals: Referral[] = [];

// Medical Specialties for Doctors
export const medicalSpecialties = [
  'Addiction Medicine',
  'Adolescent Medicine',
  'Allergy & Immunology',
  'Anesthesiology',
  'Cardiac Electrophysiology',
  'Cardiology',
  'Cardiothoracic Surgery',
  'Child & Adolescent Psychiatry',
  'Clinical Neurophysiology',
  'Colon & Rectal Surgery',
  'Critical Care Medicine',
  'Dermatology',
  'Developmental-Behavioral Pediatrics',
  'Diagnostic Radiology',
  'Emergency Medicine',
  'Endocrinology',
  'Family Medicine',
  'Forensic Psychiatry',
  'Gastroenterology',
  'General Surgery',
  'Geriatric Medicine',
  'Geriatric Psychiatry',
  'Gynecologic Oncology',
  'Hand Surgery',
  'Hematology',
  'Hospice & Palliative Medicine',
  'Hospital Medicine',
  'Infectious Disease',
  'Internal Medicine',
  'Interventional Cardiology',
  'Interventional Radiology',
  'Maternal-Fetal Medicine',
  'Medical Genetics',
  'Medical Oncology',
  'Neonatal-Perinatal Medicine',
  'Nephrology',
  'Neurological Surgery',
  'Neurology',
  'Neuropathology',
  'Nuclear Medicine',
  'Obstetrics & Gynecology',
  'Occupational Medicine',
  'Ophthalmology',
  'Orthopedic Surgery',
  'Otolaryngology (ENT)',
  'Pain Medicine',
  'Pain Management',
  'Pathology',
  'Pediatric Cardiology',
  'Pediatric Emergency Medicine',
  'Pediatric Endocrinology',
  'Pediatric Gastroenterology',
  'Pediatric Hematology-Oncology',
  'Pediatric Infectious Disease',
  'Pediatric Nephrology',
  'Pediatric Neurology',
  'Pediatric Pulmonology',
  'Pediatric Radiology',
  'Pediatric Surgery',
  'Pediatrics',
  'Physical Medicine & Rehabilitation',
  'Plastic Surgery',
  'Preventive Medicine',
  'Psychiatry',
  'Psychosomatic Medicine',
  'Public Health',
  'Pulmonary Disease',
  'Radiation Oncology',
  'Reproductive Endocrinology',
  'Rheumatology',
  'Sleep Medicine',
  'Spine Surgery',
  'Sports Medicine',
  'Surgical Oncology',
  'Thoracic Surgery',
  'Transplant Surgery',
  'Trauma Surgery',
  'Urology',
  'Vascular Medicine',
  'Vascular Surgery'
];

// Legal Specialties for Attorneys
export const legalSpecialties = [
  'Administrative Law',
  'Admiralty Law',
  'Alternative Dispute Resolution',
  'Antitrust Law',
  'Appellate Law',
  'Arbitration',
  'Aviation Law',
  'Banking Law',
  'Bankruptcy',
  'Business Law',
  'Car Accident',
  'Child Custody',
  'Civil Rights',
  'Class Action',
  'Commercial Law',
  'Construction Law',
  'Consumer Law',
  'Contract Law',
  'Corporate Law',
  'Criminal Defense',
  'Criminal Law',
  'Cybersecurity Law',
  'Data Privacy',
  'Disability Law',
  'Divorce',
  'Drug Crimes',
  'DUI/DWI',
  'Education Law',
  'Elder Law',
  'Employment Law',
  'Energy Law',
  'Entertainment Law',
  'Environmental Law',
  'Estate Planning',
  'Family Law',
  'Federal Criminal',
  'Franchise Law',
  'Free Consultation',
  'General Practice',
  'Government Contracts',
  'Healthcare Law',
  'Immigration Law',
  'Insurance Defense',
  'Insurance Law',
  'Intellectual Property',
  'International Law',
  'Labor Law',
  'Landlord-Tenant',
  'Legal Malpractice',
  'Litigation',
  'Medical Malpractice',
  'Mergers & Acquisitions',
  'Military Law',
  'Municipal Law',
  'Patent Law',
  'Personal Injury',
  'PI Attorney',
  'Product Liability',
  'Professional Malpractice',
  'Public Interest',
  'Real Estate Law',
  'Securities Law',
  'Slip and Fall',
  'Social Security Disability',
  'Tax Law',
  'Technology Law',
  'Trademark Law',
  'Traffic Law',
  'Trial Attorney',
  'Trusts & Estates',
  'Veterans Law',
  'White Collar Crime',
  'Workers Comp',
  'Workers Compensation',
  'Wrongful Death'
];

// Realtor Specialties
export const realtorSpecialties = [
  'Agricultural Real Estate',
  'Apartment Leasing',
  'Commercial Real Estate',
  'Condominium Specialist',
  'Corporate Relocation',
  'Development Land',
  'Distressed Properties',
  'Farm & Ranch',
  'First-Time Home Buyers',
  'Foreclosures',
  'Green Building',
  'Historic Properties',
  'HOA Management',
  'Home Staging',
  'Industrial Real Estate',
  'Investment Properties',
  'Land Development',
  'Luxury Homes',
  'Military Relocation',
  'Mobile Homes',
  'Multi-Family',
  'New Construction',
  'Office Buildings',
  'Property Management',
  'Relocation Services',
  'Rental Properties',
  'Residential Real Estate',
  'Retail Real Estate',
  'Rural Properties',
  'Senior Housing',
  'Short Sales',
  'Single Family Homes',
  'Student Housing',
  'Timeshare',
  'Vacation Homes',
  'Waterfront Properties'
];

// Combined specialties for general use
export const specialtyOptions = [
  ...medicalSpecialties,
  ...legalSpecialties,
  ...realtorSpecialties
].sort();

export const languageOptions = [
  'Arabic',
  'Bengali',
  'Cantonese',
  'Chinese',
  'Croatian',
  'Czech',
  'Danish',
  'Dutch',
  'English',
  'Finnish',
  'French',
  'German',
  'Greek',
  'Haitian Creole',
  'Hebrew',
  'Hindi',
  'Hungarian',
  'Italian',
  'Japanese',
  'Korean',
  'Latvian',
  'Lithuanian',
  'Mandarin Chinese',
  'Norwegian',
  'Persian (Farsi)',
  'Polish',
  'Portuguese',
  'Romanian',
  'Russian',
  'Serbian',
  'Slovak',
  'Slovenian',
  'Spanish',
  'Swahili',
  'Swedish',
  'Tagalog',
  'Thai',
  'Turkish',
  'Ukrainian',
  'Urdu',
  'Vietnamese'
];

export const serviceOptions = [
  'Telehealth',
  'Home Visits',
  'Weekend Hours',
  'Evening Hours',
  'Same-day Appointments',
  'Emergency Services',
  'Free Consultation',
  'Payment Plans',
  'Contingency Fee',
  'Second Opinions',
  'Workers Comp Cases',
  'VA Benefits',
  'Medicare/Medicaid',
  'Most Insurance Accepted',
  'EMG/Nerve Conduction',
  'PRP Therapy',
  'Joint Injections',
  'Minimally Invasive Surgery',
  'Robotic Surgery',
  'Wills & Trusts',
  'Business Formation',
  'Document Review',
  'Mediation Services',
  'Arbitration',
  'Trial Experience',
  'Appellate Experience',
  'Multi-lingual Staff',
  'Interpreter Services',
  'Online Consultations',
  'Video Conferencing',
  '24/7 Available',
  'After Hours',
  'Bilingual',
  'Board Certified',
  'Certified',
  'Compassionate',
  'Convenient Location',
  'Emergency Services',
  'Evening Hours',
  'Experienced',
  'Expert',
  'Family-Owned',
  'Fast Response',
  'Free Consultation',
  'Free Estimates',
  'Friendly',
  'Highly Rated',
  'Home Visits',
  'Licensed',
  'Local',
  'Multi-lingual',
  'Nationwide',
  'Online Booking',
  'Payment Plans',
  'Professional',
  'Quick Response',
  'Reliable',
  'Same Day Service',
  'Saturday Hours',
  'Sunday Hours',
  'Telehealth',
  'Top Rated',
  'Trusted',
  'Veteran Owned',
  'Weekend Hours',
  'Wheelchair Accessible'
];

export const tagOptions = [
  // Medical Tags
  'Accepts New Patients',
  'Accepts Medicare',
  'Accepts Medicaid',
  'Accepts Most Insurance',
  'Accepts Tricare',
  'Accepts VA Benefits',
  'Addiction Specialist',
  'Adolescent Medicine',
  'Allergy Specialist',
  'Alternative Medicine',
  'Anesthesiology',
  'Arthritis Specialist',
  'Auto Injury Specialist',
  'Back Pain Specialist',
  'Board Certified',
  'Breast Cancer Specialist',
  'Cardiac Specialist',
  'Cardiology',
  'Child Specialist',
  'Chronic Pain Specialist',
  'Clinical Trials',
  'Colonoscopy',
  'Cosmetic Surgery',
  'Critical Care',
  'Dermatology',
  'Diabetes Specialist',
  'Diagnostic Imaging',
  'Emergency Medicine',
  'Endocrinology',
  'Family Medicine',
  'Fellowship Trained',
  'Fertility Specialist',
  'Gastroenterology',
  'Geriatric Specialist',
  'Gynecology',
  'Hand Surgery',
  'Headache Specialist',
  'Heart Specialist',
  'Hematology',
  'Hospice Care',
  'Hospital Medicine',
  'Immunology',
  'Infectious Disease',
  'Internal Medicine',
  'Interventional Cardiology',
  'Interventional Radiology',
  'Joint Replacement',
  'Kidney Specialist',
  'Laser Surgery',
  'Lung Specialist',
  'Maternity Care',
  'Medical Marijuana',
  'Menopause Specialist',
  'Minimally Invasive',
  'Neonatal Care',
  'Nephrology',
  'Neurology',
  'Neurosurgery',
  'Nuclear Medicine',
  'Obstetrics',
  'Oncology',
  'Ophthalmology',
  'Orthopedic Surgery',
  'Pain Management',
  'Palliative Care',
  'Pathology',
  'Pediatric Cardiology',
  'Pediatric Emergency',
  'Pediatric Endocrinology',
  'Pediatric Gastroenterology',
  'Pediatric Neurology',
  'Pediatric Oncology',
  'Pediatric Surgery',
  'Pediatrics',
  'Physical Therapy',
  'Plastic Surgery',
  'Podiatry',
  'Preventive Care',
  'Psychiatry',
  'Pulmonary Medicine',
  'Radiation Oncology',
  'Radiology',
  'Rehabilitation',
  'Reproductive Medicine',
  'Rheumatology',
  'Robotic Surgery',
  'Same Day Surgery',
  'Sleep Medicine',
  'Spine Specialist',
  'Sports Medicine',
  'Surgery',
  'Telehealth',
  'Transplant',
  'Trauma Surgery',
  'Travel Medicine',
  'Urology',
  'Vascular Surgery',
  'Weight Loss',
  'Women\'s Health',
  
  // Legal Tags
  'Trial Attorney',
  'PI Attorney',
  'Personal Injury',
  'Med Mal Specialist',
  'Workers Comp Legal',
  'Criminal Defense',
  'Family Law',
  'Immigration Legal',
  'Estate Planning Legal',
  'Business Law',
  'Real Estate Legal',
  'Contingency Fee',
  'Free Consultation',
  'Bilingual Legal',
  'Multi-lingual Legal',
  'Experienced Legal',
  'AV Rated',
  'Super Lawyer',
  
  // Language Tags
  'Arabic-speaking',
  'Bengali-speaking',
  'Chinese-speaking',
  'Croatian-speaking',
  'Czech-speaking',
  'Danish-speaking',
  'Dutch-speaking',
  'English-speaking',
  'Finnish-speaking',
  'French-speaking',
  'German-speaking',
  'Greek-speaking',
  'Haitian Creole-speaking',
  'Hebrew-speaking',
  'Hindi-speaking',
  'Hungarian-speaking',
  'Italian-speaking',
  'Japanese-speaking',
  'Korean-speaking',
  'Latvian-speaking',
  'Lithuanian-speaking',
  'Mandarin-speaking',
  'Norwegian-speaking',
  'Persian-speaking',
  'Polish-speaking',
  'Portuguese-speaking',
  'Romanian-speaking',
  'Russian-speaking',
  'Serbian-speaking',
  'Slovak-speaking',
  'Slovenian-speaking',
  'Spanish-speaking',
  'Swahili-speaking',
  'Swedish-speaking',
  'Tagalog-speaking',
  'Thai-speaking',
  'Turkish-speaking',
  'Ukrainian-speaking',
  'Urdu-speaking',
  'Vietnamese-speaking',
  
  // General Tags
  'Highly Recommended',
  'Excellent Reviews',
  'Professional',
  'Responsive',
  'Compassionate',
  'Experienced',
  'Knowledgeable',
  'Trustworthy',
  'Reliable',
  'Efficient',
  
  // Realtor Tags
  'Agricultural Real Estate',
  'Apartment Leasing',
  'Commercial Real Estate',
  'Condominium Specialist',
  'Corporate Relocation',
  'Development Land',
  'Distressed Properties',
  'Farm & Ranch',
  'First-Time Home Buyers',
  'Foreclosures',
  'Green Building',
  'Historic Properties',
  'HOA Management',
  'Home Staging',
  'Industrial Real Estate',
  'Investment Properties',
  'Land Development',
  'Luxury Homes',
  'Military Relocation',
  'Mobile Homes',
  'Multi-Family',
  'New Construction',
  'Office Buildings',
  'Property Management',
  'Relocation Services',
  'Rental Properties',
  'Residential Real Estate',
  'Retail Real Estate',
  'Rural Properties',
  'Senior Housing',
  'Short Sales',
  'Single Family Homes',
  'Student Housing',
  'Timeshare',
  'Vacation Homes',
  'Waterfront Properties'
];

export const caseTypeOptions = [
  'Personal Injury',
  'Medical Malpractice',
  'Workers Compensation',
  'Auto Accident',
  'Motorcycle Accident',
  'Truck Accident',
  'Slip and Fall',
  'Product Liability',
  'Wrongful Death',
  'Birth Injury',
  'Surgical Error',
  'Misdiagnosis',
  'Medication Error',
  'Hospital Negligence',
  'Nursing Home Abuse',
  'Immigration Case',
  'Family Law Matter',
  'Divorce',
  'Child Custody',
  'Criminal Defense',
  'DUI/DWI',
  'Drug Charges',
  'Assault Charges',
  'Real Estate Transaction',
  'Estate Planning',
  'Probate',
  'Corporate Matter',
  'Business Dispute',
  'Contract Dispute',
  'Employment Issue',
  'Tax Issue',
  'Bankruptcy',
  'Healthcare Compliance',
  'Insurance Dispute',
  'Civil Rights',
  'Class Action',
  'Appeals Case'
];

// Function to generate referrals from existing cards (user's perspective)
export const generateReferralsFromCards = (cards: BusinessCard[]): Omit<Referral, 'id'>[] => {
  if (cards.length === 0) {
    return [];
  }

  const referrals: Omit<Referral, 'id'>[] = [];
  const caseTypes = caseTypeOptions;
  
  // Generate 3-6 referrals total (mix of sent and received)
  const totalReferrals = Math.floor(Math.random() * 4) + 3; // 3-6 referrals
  
  for (let i = 0; i < totalReferrals; i++) {
    // Randomly select a contact from the user's cards
    const contactCard = cards[Math.floor(Math.random() * cards.length)];
    
    // Randomly decide if this is a sent or received referral
    const direction = Math.random() > 0.5 ? 'sent' : 'received';
    const outcome = Math.random() > 0.4 ? 'successful' : (Math.random() > 0.6 ? 'pending' : 'unsuccessful');
    
    // Generate a date within the last 12 months
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getTime() - (12 * 30 * 24 * 60 * 60 * 1000));
    const randomDate = new Date(twelveMonthsAgo.getTime() + Math.random() * (now.getTime() - twelveMonthsAgo.getTime()));
    
    // Generate case type based on the contact's profession
    let caseType = caseTypes[Math.floor(Math.random() * caseTypes.length)];
    
    // Make case types more relevant to the contact's profession
    if (contactCard.title?.toLowerCase().includes('attorney') || contactCard.title?.toLowerCase().includes('lawyer')) {
      const legalCases = ['Personal Injury', 'Medical Malpractice', 'Auto Accident', 'Workers Compensation', 'Family Law Matter', 'Immigration Case', 'Estate Planning', 'Criminal Defense'];
      caseType = legalCases[Math.floor(Math.random() * legalCases.length)];
    } else if (contactCard.title?.toLowerCase().includes('doctor') || contactCard.title?.toLowerCase().includes('physician')) {
      const medicalCases = ['Medical Malpractice', 'Birth Injury', 'Surgical Error', 'Misdiagnosis', 'Medication Error', 'Hospital Negligence', 'Personal Injury'];
      caseType = medicalCases[Math.floor(Math.random() * medicalCases.length)];
    } else if (contactCard.title?.toLowerCase().includes('real estate') || contactCard.title?.toLowerCase().includes('realtor')) {
      const realEstateCases = ['Real Estate Transaction', 'Property Dispute', 'Contract Dispute', 'Estate Planning'];
      caseType = realEstateCases[Math.floor(Math.random() * realEstateCases.length)];
    } else if (contactCard.title?.toLowerCase().includes('accountant') || contactCard.title?.toLowerCase().includes('cpa')) {
      const accountingCases = ['Tax Issue', 'Business Dispute', 'Contract Dispute', 'Estate Planning'];
      caseType = accountingCases[Math.floor(Math.random() * accountingCases.length)];
    }
    
    // Generate realistic values based on case type
    let value = 0;
    if (caseType.includes('Personal Injury') || caseType.includes('Medical Malpractice')) {
      value = Math.floor(Math.random() * 200000) + 50000; // $50k - $250k
    } else if (caseType.includes('Auto Accident') || caseType.includes('Car Accident')) {
      value = Math.floor(Math.random() * 100000) + 25000; // $25k - $125k
    } else if (caseType.includes('Real Estate')) {
      value = Math.floor(Math.random() * 50000) + 10000; // $10k - $60k
    } else if (caseType.includes('Family Law')) {
      value = Math.floor(Math.random() * 30000) + 5000; // $5k - $35k
    } else if (caseType.includes('Tax Issue')) {
      value = Math.floor(Math.random() * 25000) + 5000; // $5k - $30k
    } else {
      value = Math.floor(Math.random() * 75000) + 15000; // $15k - $90k
    }
    
    // Create referral from user's perspective
    const referral: Omit<Referral, 'id'> = {
      referrerId: direction === 'sent' ? 'USER_ID' : contactCard.id, // Will be replaced with actual user ID
      recipientId: direction === 'sent' ? contactCard.id : 'USER_ID', // Will be replaced with actual user ID
      date: randomDate,
      caseType: caseType,
      outcome: outcome,
      value: value,
      direction: direction,
      notes: direction === 'sent' 
        ? `I referred a client to ${contactCard.name} (${contactCard.title}) for a ${caseType} case. ${outcome === 'successful' ? 'The case was successful and the client was satisfied.' : outcome === 'pending' ? 'The case is currently in progress.' : 'The case did not result in a favorable outcome.'}`
        : `${contactCard.name} (${contactCard.title}) referred a client to me for a ${caseType} case. ${outcome === 'successful' ? 'The case was successful and the client was satisfied.' : outcome === 'pending' ? 'The case is currently in progress.' : 'The case did not result in a favorable outcome.'}`,
    };
    
    referrals.push(referral);
  }
  
  return referrals;
};
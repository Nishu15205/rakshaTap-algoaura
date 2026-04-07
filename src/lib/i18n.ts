export type Language = 'en' | 'hi'

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.bookCall': 'Book a Call',
    'nav.joinExpert': 'Join as Expert',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.profile': 'My Profile',
    'nav.subscription': 'Subscription',
    'nav.adminDashboard': 'Admin Dashboard',
    'nav.expertPortal': 'Expert Portal',
    'nav.notifications': 'Notifications',
    'nav.theme': 'Toggle theme',

    // Hero Section
    'hero.title': 'Expert Video Consultations',
    'hero.subtitle': 'for New Parents',
    'hero.description': 'Connect instantly with certified childcare experts. Get personalized guidance for your little one from the comfort of your home.',
    'hero.cta.instant': 'Start Instant Call',
    'hero.cta.schedule': 'Schedule a Call',
    'hero.badge': 'Trusted by 5000+ Parents',
    'hero.badgeSub': 'Experts available 24/7',

    // How It Works
    'how.title': 'How It Works',
    'how.step1.title': 'Choose an Expert',
    'how.step1.desc': 'Browse our certified childcare professionals and pick the perfect match for your needs.',
    'how.step2.title': 'Book a Session',
    'how.step2.desc': 'Pick instant or scheduled calls at your convenience. Pay securely online.',
    'how.step3.title': 'Get Expert Help',
    'how.step3.desc': 'Connect via video call and get personalized guidance for your parenting journey.',

    // Experts/Nannies
    'experts.title': 'Our Experts',
    'experts.subtitle': 'Handpicked childcare professionals with years of experience',
    'experts.online': 'experts online now',
    'experts.offline': 'Currently Offline',
    'experts.rating': 'Rating',
    'experts.experience': 'Years Exp',
    'experts.price': 'Free during trial',
    'experts.languages': 'Languages',
    'experts.specialty': 'Specialty',
    'experts.all': 'All',
    'experts.newborn': 'Newborn Care',
    'experts.sleep': 'Sleep Training',
    'experts.lactation': 'Lactation',
    'experts.nutrition': 'Nutrition',
    'experts.postpartum': 'Postpartum',
    'experts.development': 'Development',
    'experts.specialNeeds': 'Special Needs',

    // Booking
    'booking.loginRequired': 'Login Required',
    'booking.loginMsg': 'Please login to book a consultation with this expert.',
    'booking.bookNow': 'Book Now',
    'booking.loginToBook': 'Login to Book',
    'booking.offline': 'Currently Offline',
    'booking.instant': 'Instant Call',
    'booking.scheduled': 'Schedule Call',
    'booking.selectType': 'Select Call Type',
    'booking.selectDate': 'Select Date & Time',
    'booking.yourDetails': 'Your Details',
    'booking.confirm': 'Confirm Booking',
    'booking.payment': 'Complete Payment',
    'booking.success': 'Booking Confirmed!',
    'booking.cancelled': 'Booking Cancelled',

    // Call Interface
    'call.connecting': 'Connecting...',
    'call.ringing': 'Ringing...',
    'call.active': 'Call in Progress',
    'call.ended': 'Call Ended',
    'call.mute': 'Mute',
    'call.unmute': 'Unmute',
    'call.toggleVideo': 'Toggle Video',
    'call.endCall': 'End Call',
    'call.chat': 'Chat',
    'call.timer': 'Duration',
    'call.startCall': 'Start Call',

    // Payment
    'payment.title': 'Choose Your Plan',
    'payment.basic': 'Basic',
    'payment.premium': 'Premium',
    'payment.unlimited': 'Unlimited',
    'payment.monthly': 'Monthly',
    'payment.yearly': 'Yearly',
    'payment.payNow': 'Pay Now',
    'payment.processing': 'Processing...',
    'payment.success': 'Payment Successful!',
    'payment.failed': 'Payment Failed',
    'payment.retry': 'Try Again',
    'payment.completePayment': 'Complete Payment to Start Call',

    // Auth
    'auth.login': 'Log In',
    'auth.signup': 'Sign Up',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.role': 'I am a',
    'auth.parent': 'Parent',
    'auth.nanny': 'Childcare Expert',
    'auth.demoCredentials': 'Demo Credentials',
    'auth.sendOtp': 'Send OTP',
    'auth.verifyOtp': 'Verify OTP',
    'auth.resetPassword': 'Reset Password',
    'auth.newPassword': 'New Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.backToLogin': 'Back to Login',

    // Profile
    'profile.title': 'My Profile',
    'profile.edit': 'Edit Profile',
    'profile.save': 'Save Changes',
    'profile.subscription': 'Subscription',
    'profile.callHistory': 'Call History',
    'profile.noCalls': 'No calls yet',

    // Admin Dashboard
    'admin.title': 'Admin Dashboard',
    'admin.overview': 'Overview',
    'admin.nannies': 'Manage Consultants',
    'admin.applications': 'Applications',
    'admin.bookings': 'Bookings',
    'admin.payments': 'Payments',
    'admin.settings': 'Settings',
    'admin.totalUsers': 'Total Users',
    'admin.activeExperts': 'Active Experts',
    'admin.todaysCalls': "Today's Calls",
    'admin.revenue': 'Revenue',

    // Testimonials
    'testimonials.title': 'What Parents Say',
    'testimonials.subtitle': 'Real stories from real parents who found help through MUMAA',
    'testimonials.testimonial1': 'MUMAA helped me through the toughest first weeks with my newborn. The lactation expert was incredibly patient and knowledgeable.',
    'testimonials.testimonial2': 'I was struggling with my baby\'s sleep schedule for months. One consultation with a MUMAA sleep expert changed everything!',
    'testimonials.testimonial3': 'As a first-time mom, having a video call with a childcare expert at 2 AM when my baby wouldn\'t stop crying was a lifesaver.',
    'testimonials.testimonial4': 'The nutrition guidance for my toddler has been excellent. We received a personalized meal plan that my child actually enjoys!',
    'testimonials.testimonial5': 'Postpartum recovery support from MUMAA experts made all the difference. They understood exactly what I was going through.',
    'testimonials.testimonial6': 'Affordable, accessible, and truly expert care. I recommend MUMAA to every new parent I know.',

    // My Bookings
    'bookings.title': 'My Bookings',
    'bookings.upcoming': 'Upcoming',
    'bookings.completed': 'Completed',
    'bookings.cancelled': 'Cancelled',
    'bookings.all': 'All',
    'bookings.joinCall': 'Join Call',
    'bookings.noBookings': 'No bookings yet',
    'bookings.empty': 'Book your first consultation with an expert!',

    // Notifications
    'notifications.title': 'Notifications',
    'notifications.markRead': 'Mark as read',
    'notifications.clearAll': 'Clear all',
    'notifications.noNotifications': 'No new notifications',

    // Reviews
    'review.title': 'Leave a Review',
    'review.submit': 'Submit Review',
    'review.placeholder': 'Share your experience...',

    // Status Messages
    'status.loading': 'Loading...',
    'status.error': 'Something went wrong',
    'status.retry': 'Please try again',
    'status.success': 'Success!',
    'status.saved': 'Changes saved successfully',
    'status.deleted': 'Deleted successfully',

    // Footer
    'footer.quickLinks': 'Quick Links',
    'footer.services': 'Our Services',
    'footer.contact': 'Contact Us',
    'footer.rights': 'All rights reserved.',
    'footer.madeWith': 'Made with love for parents everywhere',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms & Conditions',
    'footer.refund': 'Refund Policy',
    'footer.cookies': 'Cookie Settings',

    // Legal Pages
    'legal.title': 'Legal Information',
    'legal.privacy': 'Privacy Policy',
    'legal.terms': 'Terms & Conditions',
    'legal.refund': 'Refund Policy',
    'legal.lastUpdated': 'Last updated',

    // Cookie Consent
    'cookies.title': 'We use cookies',
    'cookies.message': 'We use cookies to enhance your experience, analyze site traffic, and personalize content.',
    'cookies.acceptAll': 'Accept All',
    'cookies.customize': 'Customize',
    'cookies.essential': 'Essential',
    'cookies.analytics': 'Analytics',
    'cookies.preferences': 'Preferences',
    'cookies.save': 'Save Preferences',

    // Services list
    'service.newborn': 'Newborn Care',
    'service.sleep': 'Sleep Training',
    'service.lactation': 'Lactation Support',
    'service.postpartum': 'Postpartum Recovery',
    'service.nutrition': 'Toddler Nutrition',
    'service.development': 'Child Development',

    // Nanny Registration
    'registration.title': 'Join as a Childcare Expert',
    'registration.apply': 'Apply Now',
    'registration.submit': 'Submit Application',
    'registration.personal': 'Personal Information',
    'registration.professional': 'Professional Details',
    'registration.resume': 'Resume Upload',
    'registration.about': 'About Yourself',
    'registration.pending': 'Your application is under review',
    'registration.success': 'Application submitted successfully!',

    // Accessibility
    'a11y.skipToContent': 'Skip to main content',
    'a11y.close': 'Close',
    'a11y.open': 'Open',
    'a11y.expand': 'Expand',
    'a11y.collapse': 'Collapse',
  },
  hi: {
    // Navigation
    'nav.bookCall': 'कॉल बुक करें',
    'nav.joinExpert': 'एक्सपर्ट बनें',
    'nav.login': 'लॉगिन',
    'nav.logout': 'लॉगआउट',
    'nav.profile': 'मेरी प्रोफाइल',
    'nav.subscription': 'सदस्यता',
    'nav.adminDashboard': 'एडमिन डैशबोर्ड',
    'nav.expertPortal': 'एक्सपर्ट पोर्टल',
    'nav.notifications': 'सूचनाएं',
    'nav.theme': 'थीम बदलें',

    // Hero Section
    'hero.title': 'एक्सपर्ट वीडियो कंसल्टेशन',
    'hero.subtitle': 'नए माता-पिता के लिए',
    'hero.description': 'प्रमाणित चाइल्डकेयर एक्सपर्ट्स से तुरंत जुड़ें। अपने घर बैठे अपने छोटे से बच्चे के लिए व्यक्तिगत मार्गदर्शन प्राप्त करें।',
    'hero.cta.instant': 'तुरंत कॉल शुरू करें',
    'hero.cta.schedule': 'कॉल शेड्यूल करें',
    'hero.badge': '5000+ माता-पिता भरोसा करते हैं',
    'hero.badgeSub': '24/7 एक्सपर्ट उपलब्ध',

    // How It Works
    'how.title': 'कैसे काम करता है',
    'how.step1.title': 'एक्सपर्ट चुनें',
    'how.step1.desc': 'हमारे प्रमाणित चाइल्डकेयर पेशेवरों को ब्राउज़ करें और अपनी ज़रूरत के लिए सही मैच चुनें।',
    'how.step2.title': 'सेशन बुक करें',
    'how.step2.desc': 'अपनी सुविधा अनुसार तत्काल या निर्धारित कॉल चुनें। ऑनलाइन सुरक्षित भुगतान करें।',
    'how.step3.title': 'एक्सपर्ट मदद पाएं',
    'how.step3.desc': 'वीडियो कॉल के माध्यम से जुड़ें और अपनी पेरेंटिंग यात्रा के लिए व्यक्तिगत मार्गदर्शन प्राप्त करें।',

    // Experts/Nannies
    'experts.title': 'हमारे एक्सपर्ट्स',
    'experts.subtitle': 'वर्षों के अनुभव वाले चुनिंदा चाइल्डकेयर पेशेवर',
    'experts.online': 'एक्सपर्ट्स अभी ऑनलाइन हैं',
    'experts.offline': 'फिलहाल ऑफलाइन',
    'experts.rating': 'रेटिंग',
    'experts.experience': 'वर्षों का अनुभव',
    'experts.price': 'ट्रायल में मुफ़्त',
    'experts.languages': 'भाषाएं',
    'experts.specialty': 'विशेषज्ञता',
    'experts.all': 'सभी',
    'experts.newborn': 'नवजात देखभाल',
    'experts.sleep': 'नींद प्रशिक्षण',
    'experts.lactation': 'स्तनपान',
    'experts.nutrition': 'पोषण',
    'experts.postpartum': 'प्रसव पश्चात',
    'experts.development': 'विकास',
    'experts.specialNeeds': 'विशेष ज़रूरतें',

    // Booking
    'booking.loginRequired': 'लॉगिन ज़रूरी है',
    'booking.loginMsg': 'एक्सपर्ट से कंसल्टेशन बुक करने के लिए कृपया लॉगिन करें।',
    'booking.bookNow': 'अभी बुक करें',
    'booking.loginToBook': 'बुक करने के लिए लॉगिन करें',
    'booking.offline': 'फिलहाल ऑफलाइन',
    'booking.instant': 'तुरंत कॉल',
    'booking.scheduled': 'शेड्यूल कॉल',
    'booking.selectType': 'कॉल का प्रकार चुनें',
    'booking.selectDate': 'तारीख और समय चुनें',
    'booking.yourDetails': 'आपकी जानकारी',
    'booking.confirm': 'बुकिंग की पुष्टि करें',
    'booking.payment': 'भुगतान पूरा करें',
    'booking.success': 'बुकिंग की पुष्टि हो गई!',
    'booking.cancelled': 'बुकिंग रद्द हो गई',

    // Call Interface
    'call.connecting': 'कनेक्ट हो रहा है...',
    'call.ringing': 'रिंग हो रहा है...',
    'call.active': 'कॉल जारी है',
    'call.ended': 'कॉल समाप्त',
    'call.mute': 'म्यूट करें',
    'call.unmute': 'अनम्यूट करें',
    'call.toggleVideo': 'वीडियो टॉगल करें',
    'call.endCall': 'कॉल समाप्त करें',
    'call.chat': 'चैट',
    'call.timer': 'अवधि',
    'call.startCall': 'कॉल शुरू करें',

    // Payment
    'payment.title': 'अपना प्लान चुनें',
    'payment.basic': 'बेसिक',
    'payment.premium': 'प्रीमियम',
    'payment.unlimited': 'अनलिमिटेड',
    'payment.monthly': 'मासिक',
    'payment.yearly': 'वार्षिक',
    'payment.payNow': 'अभी भुगतान करें',
    'payment.processing': 'प्रोसेसिंग...',
    'payment.success': 'भुगतान सफल!',
    'payment.failed': 'भुगतान विफल',
    'payment.retry': 'पुनः प्रयास करें',
    'payment.completePayment': 'कॉल शुरू करने के लिए भुगतान पूरा करें',

    // Auth
    'auth.login': 'लॉग इन करें',
    'auth.signup': 'साइन अप करें',
    'auth.forgotPassword': 'पासवर्ड भूल गए?',
    'auth.email': 'ईमेल पता',
    'auth.password': 'पासवर्ड',
    'auth.name': 'पूरा नाम',
    'auth.role': 'मैं हूं एक',
    'auth.parent': 'माता-पिता',
    'auth.nanny': 'चाइल्डकेयर एक्सपर्ट',
    'auth.demoCredentials': 'डेमो क्रेडेंशियल',
    'auth.sendOtp': 'OTP भेजें',
    'auth.verifyOtp': 'OTP सत्यापित करें',
    'auth.resetPassword': 'पासवर्ड रीसेट करें',
    'auth.newPassword': 'नया पासवर्ड',
    'auth.confirmPassword': 'पासवर्ड की पुष्टि करें',
    'auth.backToLogin': 'लॉगिन पर वापस जाएं',

    // Profile
    'profile.title': 'मेरी प्रोफाइल',
    'profile.edit': 'प्रोफाइल संपादित करें',
    'profile.save': 'परिवर्तन सहेजें',
    'profile.subscription': 'सदस्यता',
    'profile.callHistory': 'कॉल इतिहास',
    'profile.noCalls': 'अभी तक कोई कॉल नहीं',

    // Admin Dashboard
    'admin.title': 'एडमिन डैशबोर्ड',
    'admin.overview': 'अवलोकन',
    'admin.nannies': 'कंसल्टेंट्स प्रबंधित करें',
    'admin.applications': 'आवेदन',
    'admin.bookings': 'बुकिंग्स',
    'admin.payments': 'भुगतान',
    'admin.settings': 'सेटिंग्स',
    'admin.totalUsers': 'कुल उपयोगकर्ता',
    'admin.activeExperts': 'सक्रिय एक्सपर्ट्स',
    'admin.todaysCalls': 'आज की कॉल्स',
    'admin.revenue': 'राजस्व',

    // Testimonials
    'testimonials.title': 'माता-पिता क्या कहते हैं',
    'testimonials.subtitle': 'MUMAA से मदद पाने वाले असली माता-पिता की असली कहानियां',
    'testimonials.testimonial1': 'MUMAA ने मेरे नवजात के साथ सबसे कठिन पहले हफ्तों में मेरी मदद की। स्तनपान विशेषज्ञ बेहद धैर्यवान और जानकार थे।',
    'testimonials.testimonial2': 'मैं महीनों तक अपने बच्चे की नींद के शेड्यूल के साथ संघर्ष कर रही थी। MUMAA के एक स्लीप एक्सपर्ट से एक कंसल्टेशन ने सब बदल दिया!',
    'testimonials.testimonial3': 'पहली बार माँ बनने के नाते, रात 2 बजे जब मेरा बच्चा रोना बंद नहीं कर रहा था तब चाइल्डकेयर एक्सपर्ट से वीडियो कॉल एक जीवनरक्षक साबित हुई।',
    'testimonials.testimonial4': 'मेरे टॉडलर के लिए पोषण मार्गदर्शन उत्कृष्ट रहा है। हमें एक व्यक्तिगत भोजन योजना मिली जो मेरा बच्चा वास्तव में आनंद से खाता है!',
    'testimonials.testimonial5': 'MUMAA एक्सपर्ट्स से प्रसव पश्चात वसूली समर्थन ने सारा अंतर किया। वे समझते थे कि मैं किससे गुज़र रही हूं।',
    'testimonials.testimonial6': 'किफ़ायती, सुलभ, और सच में विशेषज्ञ देखभाल। मैं हर नए माता-पिता को MUMAA की सिफ़ारिश करती हूं।',

    // My Bookings
    'bookings.title': 'मेरी बुकिंग्स',
    'bookings.upcoming': 'आगामी',
    'bookings.completed': 'पूर्ण',
    'bookings.cancelled': 'रद्द',
    'bookings.all': 'सभी',
    'bookings.joinCall': 'कॉल से जुड़ें',
    'bookings.noBookings': 'अभी तक कोई बुकिंग नहीं',
    'bookings.empty': 'एक एक्सपर्ट के साथ अपनी पहली कंसल्टेशन बुक करें!',

    // Notifications
    'notifications.title': 'सूचनाएं',
    'notifications.markRead': 'पढ़ा हुआ मार्क करें',
    'notifications.clearAll': 'सब हटाएं',
    'notifications.noNotifications': 'कोई नई सूचना नहीं',

    // Reviews
    'review.title': 'रिव्यू दें',
    'review.submit': 'रिव्यू सबमिट करें',
    'review.placeholder': 'अपना अनुभव साझा करें...',

    // Status Messages
    'status.loading': 'लोड हो रहा है...',
    'status.error': 'कुछ गलत हो गया',
    'status.retry': 'कृपया पुनः प्रयास करें',
    'status.success': 'सफल!',
    'status.saved': 'परिवर्तन सफलतापूर्वक सहेजे गए',
    'status.deleted': 'सफलतापूर्वक हटा दिया गया',

    // Footer
    'footer.quickLinks': 'त्वरित लिंक',
    'footer.services': 'हमारी सेवाएं',
    'footer.contact': 'संपर्क करें',
    'footer.rights': 'सर्वाधिकार सुरक्षित।',
    'footer.madeWith': 'दुनिया भर के माता-पिताओं के लिए प्यार से बनाया गया',
    'footer.privacy': 'गोपनीयता नीति',
    'footer.terms': 'नियम और शर्तें',
    'footer.refund': 'रिफंड नीति',
    'footer.cookies': 'कुकी सेटिंग्स',

    // Legal Pages
    'legal.title': 'कानूनी जानकारी',
    'legal.privacy': 'गोपनीयता नीति',
    'legal.terms': 'नियम और शर्तें',
    'legal.refund': 'रिफंड नीति',
    'legal.lastUpdated': 'अंतिम अपडेट',

    // Cookie Consent
    'cookies.title': 'हम कुकीज़ का उपयोग करते हैं',
    'cookies.message': 'हम आपके अनुभव को बेहतर बनाने, साइट ट्रैफ़िक का विश्लेषण करने और सामग्री को व्यक्तिगत बनाने के लिए कुकीज़ का उपयोग करते हैं।',
    'cookies.acceptAll': 'सभी स्वीकार करें',
    'cookies.customize': 'कस्टमाइज़ करें',
    'cookies.essential': 'आवश्यक',
    'cookies.analytics': 'विश्लेषण',
    'cookies.preferences': 'प्राथमिकताएं',
    'cookies.save': 'प्राथमिकताएं सहेजें',

    // Services list
    'service.newborn': 'नवजात देखभाल',
    'service.sleep': 'नींद प्रशिक्षण',
    'service.lactation': 'स्तनपान सहायता',
    'service.postpartum': 'प्रसव पश्चात वसूली',
    'service.nutrition': 'टॉडलर पोषण',
    'service.development': 'बाल विकास',

    // Nanny Registration
    'registration.title': 'चाइल्डकेयर एक्सपर्ट बनें',
    'registration.apply': 'अभी आवेदन करें',
    'registration.submit': 'आवेदन जमा करें',
    'registration.personal': 'व्यक्तिगत जानकारी',
    'registration.professional': 'पेशेवर विवरण',
    'registration.resume': 'रिज़्यूमे अपलोड',
    'registration.about': 'अपने बारे में',
    'registration.pending': 'आपका आवेदन समीक्षा में है',
    'registration.success': 'आवेदन सफलतापूर्वक जमा हो गया!',

    // Accessibility
    'a11y.skipToContent': 'मुख्य सामग्री पर जाएं',
    'a11y.close': 'बंद करें',
    'a11y.open': 'खोलें',
    'a11y.expand': 'विस्तार करें',
    'a11y.collapse': 'संकुचित करें',
  },
}

export function t(key: string, lang: Language = 'en'): string {
  return translations[lang]?.[key] || translations.en[key] || key
}

export function getAvailableLanguages(): { code: Language; label: string }[] {
  return [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
  ]
}

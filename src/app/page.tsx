"use client";

/**
 * Pizza Ordering Application with Square Payment Integration
 * 
 * Key Square Payment Setup:
 * - Uses sandbox Square SDK URL for sandbox app IDs
 * - Includes location ID for proper environment detection
 * - Automatically detects environment from application ID prefix
 * - Fallback to mock payment form if SDK fails to load
 * - Error handling for common Square SDK issues
 */

import { useState, useEffect } from "react";
import Image from "next/image";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  referralCode: string;
  orderDate: string;
  pickupTime: string;
  specialRequests: string;
}

interface PaymentInfo {
  type: 'cash' | 'card';
  cardToken?: string;
  cardLast4?: string;
  cardBrand?: string;
}

// Add script loading for Square Web SDK
declare global {
  interface Window {
    Square: any;
  }
}

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    phone: "",
    email: "",
    referralCode: "",
    orderDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
    pickupTime: "",
    specialRequests: ""
  });
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    type: 'cash'
  });
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [squareLoaded, setSquareLoaded] = useState(false);
  const [cardPaymentForm, setCardPaymentForm] = useState<any>(null);
  const [dateFieldError, setDateFieldError] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<{value: string, display: string}[]>([]);
  const [timeSlotCache, setTimeSlotCache] = useState<{[date: string]: {value: string, display: string}[]}>({}); 
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);

  // Load Square Web SDK
  // Track which Square environment was loaded
  const [squareEnvironment, setSquareEnvironment] = useState<'sandbox' | 'production' | null>(null);

  // Load Square SDK only when needed (when user selects card payment)
  const loadSquareScript = () => {
    if (typeof window !== 'undefined' && !window.Square && !squareLoaded) {
      
      // Try loading Square SDK with fallback URLs
      const tryLoadSquare = (urls: string[], index = 0): void => {
        if (index >= urls.length) {
          console.error('All Square SDK URLs failed to load');
          console.error('This could be due to:');
          console.error('1. Network connectivity issues');
          console.error('2. Firewall blocking the Square CDN');
          console.error('3. DNS resolution problems');
          console.error('Credit card payments will not be available');
          setSquareLoaded(false);
          return;
        }
        
        const script = document.createElement('script');
        script.src = urls[index];
        script.async = true;
        
        script.onload = () => {
          // Determine environment based on application ID, not SDK URL
          const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || 'sandbox-sq0idb-demo-app-id';
          const environment = applicationId.startsWith('sandbox-') ? 'sandbox' : 'production';
          setSquareEnvironment(environment);
          setSquareLoaded(true);
        };
        
        script.onerror = (error) => {
          console.error(`Failed to load Square SDK from: ${urls[index]}`);
          console.error('This could be due to:');
          console.error('1. Network connectivity issues');
          console.error('2. Firewall blocking the Square CDN');
          console.error('3. DNS resolution problems');
          console.error('Credit card payments will not be available');
          
          // Remove the failed script
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
          // Try the next URL
          tryLoadSquare(urls, index + 1);
        };
        
        document.head.appendChild(script);
      };

      // Determine environment from Application ID (since SQUARE_ENVIRONMENT is server-only)
      const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || 'sandbox-sq0idb-demo-app-id';
      const environment = applicationId.startsWith('sandbox-') ? 'sandbox' : 'production';
      
      const squareUrls = environment === 'production'
        ? ['https://web.squarecdn.com/v1/square.js'] // Production SDK
        : ['https://sandbox.web.squarecdn.com/v1/square.js', 'https://web.squarecdn.com/v1/square.js']; // Sandbox first, then fallback
      
      tryLoadSquare(squareUrls);
      
    } else if (window.Square && !squareLoaded) {
      // Square SDK was already loaded
      const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || 'sandbox-sq0idb-demo-app-id';
      const environment = applicationId.startsWith('sandbox-') ? 'sandbox' : 'production';
      setSquareEnvironment(environment);
      setSquareLoaded(true);
    }
  };

  // Initialize Square payment form when needed
  useEffect(() => {
    if (paymentInfo.type === 'card' && showOrderForm) {
      // Load Square SDK if not already loaded
      if (!squareLoaded && !window.Square) {
        loadSquareScript();
      }
      
      // Initialize payment form if SDK is ready
      if (squareLoaded && squareEnvironment && !cardPaymentForm) {
        initializeSquarePaymentForm();
      }
    }
  }, [squareLoaded, squareEnvironment, paymentInfo.type, showOrderForm, cardPaymentForm]);

  // Fetch available time slots when the order form opens
  useEffect(() => {
    if (showOrderForm && customerInfo.orderDate) {
      // Only fetch if it's not Sunday (invalid date)
      if (!isSunday(customerInfo.orderDate)) {
        fetchAvailableTimeSlots(customerInfo.orderDate);
      }
    }
  }, [showOrderForm]);

  const initializeSquarePaymentForm = async () => {
    if (!window.Square) {
      console.error('Square SDK not loaded yet. Enabling offline testing mode...');
      
      // Create a mock Square form for testing when SDK fails to load
      const container = document.getElementById('card-container');
      if (container) {
        container.innerHTML = `
          <div class="space-y-4">
            <div class="text-blue-600 text-center p-3 bg-blue-50 rounded mb-4">
              <p class="font-medium">Testing Mode - Square SDK Unavailable</p>
              <p class="text-sm mt-1">Using mock payment form for development</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <input type="text" placeholder="4111 1111 1111 1111" class="w-full p-2 border border-gray-300 rounded" readonly>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                <input type="text" placeholder="12/25" class="w-full p-2 border border-gray-300 rounded" readonly>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <input type="text" placeholder="123" class="w-full p-2 border border-gray-300 rounded" readonly>
              </div>
            </div>
            <div class="text-xs text-gray-600 mt-2 text-center">
              📝 This is a mock form - payment will be simulated in testing mode
            </div>
          </div>
        `;
      }
      
      // Set up a mock payment form for testing
      setCardPaymentForm({ 
        payments: { mock: true }, 
        card: { 
          mock: true,
          tokenize: () => Promise.resolve({
            status: 'OK',
            token: 'mock-token-' + Date.now(),
            details: {
              card: {
                last4: '1111',
                brand: 'Visa'
              }
            }
          })
        } 
      });
      return;
    }

    // For demo purposes, use a placeholder if no real credentials are set
    const rawApplicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || 'sandbox-sq0idb-demo-app-id';
    // Clean the application ID of any potential whitespace or invisible characters
    let applicationId = rawApplicationId.trim();
    
    // Clean application ID if it matches the expected format
    if (applicationId.includes('sandbox-sq0idb-ZlIB2SbOM9sj_MPt2WO_VQ')) {
      applicationId = 'sandbox-sq0idb-ZlIB2SbOM9sj_MPt2WO_VQ';
    }
    
    // Use the environment that was detected when the SDK was loaded
    const detectedFromAppId = applicationId.startsWith('sandbox-') ? 'sandbox' : 'production';
    const environment = squareEnvironment || detectedFromAppId;
    
    if (!process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID) {
      console.warn('Using demo mode - Square payments will not actually work until you add your real NEXT_PUBLIC_SQUARE_APPLICATION_ID');
      console.warn('See SQUARE_PAYMENT_SETUP.md for setup instructions');
    }

    try {
      // Determine environment from Application ID and use appropriate location ID
      const environment = applicationId.startsWith('sandbox-') ? 'sandbox' : 'production';
      const locationId = environment === 'production'
        ? process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || 'PRODUCTION_LOCATION_ID_NEEDED'
        : 'L8SFFEWCCGKF3'; // Sandbox location ID
      
      // Initialize Square payments - SDK auto-detects environment from application ID
      const payments = window.Square.payments(applicationId, locationId);
      const card = await payments.card();
      await card.attach('#card-container');
      
      setCardPaymentForm({ payments, card });
    } catch (error) {
      console.error('Failed to initialize Square payment form:', error);
      console.error('This is likely because you need to set up your Square credentials.');
      console.error('See SQUARE_PAYMENT_SETUP.md for instructions.');
      
      // Show an error message in the UI
      const container = document.getElementById('card-container');
      if (container) {
        container.innerHTML = `
          <div class="text-red-600 text-center p-4">
            <p class="font-medium">Payment form setup required</p>
            <p class="text-sm mt-2">Please check the console for setup instructions</p>
            <p class="text-xs mt-1">See SQUARE_PAYMENT_SETUP.md for details</p>
          </div>
        `;
      }
    }
  };

  // Gallery images - add your pizza images to public/gallery/ directory
  const galleryImages: string[] = [
    '/gallery/italianmeat.jpeg',
    '/gallery/pepperonibasil2.jpeg',
    '/gallery/cooking.jpeg',
    '/gallery/pepperonibasil.jpeg',
    '/gallery/mushroompepper.jpeg',
    '/gallery/sausagebasil.jpeg',
    '/gallery/pepperoni.jpeg',
    '/gallery/cheese.jpeg',
    '/gallery/ovenpizza.jpeg',
  ];

  // Handle ESC key to close modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showCart) {
          setShowCart(false);
        } else if (showOrderForm) {
          setShowOrderForm(false);
          setPaymentInfo({ type: 'cash' });
          setCardPaymentForm(null);
        } else if (orderSubmitted) {
          setOrderSubmitted(false);
          setCart([]);
          setCustomerInfo({ name: "", phone: "", email: "", referralCode: "", orderDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], pickupTime: "", specialRequests: "" });
          setDateFieldError(false);
        } else if (selectedImage) {
          setSelectedImage(null);
        }
      }
    };

    // Only add listener if any modal is open
    if (showCart || showOrderForm || orderSubmitted || selectedImage) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCart, showOrderForm, orderSubmitted, selectedImage]);

  const pizzaMenu = [
    { id: "margherita", name: "Classic Margherita", price: 20, description: "A simple pizza with fresh mozzarella, and our signature organic tomato sauce" },
    { id: "yoshi", name: "Yoshi's Weekly Special", price: 25, description: "Flavorful pepperoni with melted cheese, basil, and Italian seasoning" }
  ];

  const getTotalCartQuantity = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const addToCart = (pizza: typeof pizzaMenu[0]) => {
    const currentTotal = getTotalCartQuantity();
    if (currentTotal >= 2) {
      setShowCart(true);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === pizza.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === pizza.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...pizza, quantity: 1 }];
    });
    setShowCart(true);
  };

  const removeFromCart = (pizzaId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== pizzaId));
  };

  const updateQuantity = (pizzaId: string, quantity: number) => {
    if (quantity < 0) {
      quantity = 0;
    }
    
    const currentTotal = getTotalCartQuantity();
    const currentItemQuantity = cart.find(item => item.id === pizzaId)?.quantity || 0;
    const newTotal = currentTotal - currentItemQuantity + quantity;
    
    if (newTotal > 2) {
      return;
    }
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === pizzaId);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === pizzaId ? { ...item, quantity } : item
        );
      } else {
        // If item doesn't exist in cart, add it with the specified quantity
        const pizza = pizzaMenu.find(p => p.id === pizzaId);
        if (pizza) {
          return [...prevCart, { ...pizza, quantity }];
        }
      }
      return prevCart;
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const validatePhoneNumber = (phone: string) => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length === 10;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setCustomerInfo({...customerInfo, phone: formatted});
  };

  // Function to check if a date is Sunday
  const isSunday = (dateString: string) => {
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.getDay() === 0; // 0 = Sunday
  };

  // Function to check if a date is today
  const isToday = (dateString: string) => {
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Function to disable current day and Sundays in date picker
  const isDateDisabled = (dateString: string) => {
    return isToday(dateString) || isSunday(dateString);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    
    // Check if Sunday is selected and set error state
    if (isSunday(selectedDate)) {
      setDateFieldError(true);
      setCustomerInfo({...customerInfo, orderDate: selectedDate, pickupTime: ""});
      setAvailableTimeSlots([]); // Clear time slots for invalid date
    } else if (isToday(selectedDate)) {
      // If today is selected, automatically jump to next available day
      const date = new Date(selectedDate);
      do {
        date.setDate(date.getDate() + 1);
      } while (isDateDisabled(date.toISOString().split('T')[0]));
      
      const nextAvailableDate = date.toISOString().split('T')[0];
      setDateFieldError(false);
      setCustomerInfo({...customerInfo, orderDate: nextAvailableDate, pickupTime: ""});
      
      // Fetch available time slots for the auto-selected date
      fetchAvailableTimeSlots(nextAvailableDate);
    } else {
      // Valid date selected
      setDateFieldError(false);
      setCustomerInfo({...customerInfo, orderDate: selectedDate, pickupTime: ""});
      
      // Fetch available time slots for the selected date
      fetchAvailableTimeSlots(selectedDate);
    }
  };

  // Generate time options for pickup (4 PM - 8 PM with 20-minute increments)
  const generateTimeOptions = () => {
    const times = [];
    const startHour = 16; // 4 PM
    const endHour = 20; // 8 PM
    
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 20) {
        // Don't add 8:20 PM or 8:40 PM - stop at 8:00 PM
        if (hour === endHour && minutes > 0) break;
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        });
        times.push({ value: timeString, display: displayTime });
      }
    }
    
    return times;
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCustomerInfo({...customerInfo, pickupTime: e.target.value});
  };

  // Fetch available time slots for a specific date
  const fetchAvailableTimeSlots = async (date: string) => {
    // Check cache first
    if (timeSlotCache[date]) {
      setAvailableTimeSlots(timeSlotCache[date]);
      return;
    }

    setLoadingTimeSlots(true);
    try {
      const response = await fetch(`/api/available-times?date=${date}`);
      const result = await response.json();
      
      if (result.success) {
        const slots = result.availableTimeSlots;
        
        // Update cache
        setTimeSlotCache(prev => ({
          ...prev,
          [date]: slots
        }));
        
        setAvailableTimeSlots(slots);
      } else {
        console.error('Failed to fetch available time slots:', result.message);
        // Fallback to all time slots if API fails
        setAvailableTimeSlots(generateTimeOptions());
      }
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      // Fallback to all time slots if API fails
      setAvailableTimeSlots(generateTimeOptions());
    } finally {
      setLoadingTimeSlots(false);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmittingOrder) {
      return;
    }
    
    // Validate phone number
    if (!validatePhoneNumber(customerInfo.phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    
    // Validate that Sunday is not selected
    if (isSunday(customerInfo.orderDate)) {
      setDateFieldError(true);
      alert("Sorry, we are closed on Sundays. Please select a different pickup date from Monday-Saturday.");
      return;
    }
    
    // Validate that today is not selected
    if (isToday(customerInfo.orderDate)) {
      setDateFieldError(true);
      alert("Sorry, we don't accept same-day orders. Please select a pickup date at least 1 day in advance.");
      return;
    }
    
    // Validate pickup time is selected
    if (!customerInfo.pickupTime) {
      alert("Please select a pickup time.");
      return;
    }

    // Validate that the selected time is still available (in case someone else booked it)
    if (availableTimeSlots.length > 0 && !availableTimeSlots.some(slot => slot.value === customerInfo.pickupTime)) {
      alert("The selected pickup time is no longer available. Please select a different time.");
      // Clear the selected time and refresh available slots
      setCustomerInfo({...customerInfo, pickupTime: ""});
      fetchAvailableTimeSlots(customerInfo.orderDate);
      return;
    }
    
    // Set submitting state to prevent duplicates
    setIsSubmittingOrder(true);
    
    try {
      let paymentResult = null;
      
      // Process payment if credit card is selected
      if (paymentInfo.type === 'card') {
        paymentResult = await processCardPayment();
        if (!paymentResult.success) {
          alert('Payment failed. Please check your card information and try again.');
          setIsSubmittingOrder(false);
          return;
        }
      }

      // Prepare order data
      const orderDetails = {
        customer: customerInfo,
        items: cart,
        total: getTotalPrice(),
        paymentInfo: {
          ...paymentInfo,
          paymentId: paymentResult?.paymentId
        },
        orderTime: new Date().toLocaleString()
      };
      

      
      // Submit order to API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderDetails),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setOrderSubmitted(true);
        setShowOrderForm(false);
  
      } else {
        if (response.status === 409) {
          alert("Duplicate order detected. Please wait a moment before trying again.");
        } else {
          alert("Failed to submit order. Please try again.");
        }
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert("Failed to submit order. Please try again.");
    } finally {
      // Reset submitting state
      setIsSubmittingOrder(false);
    }
  };

  const processCardPayment = async () => {
    if (!cardPaymentForm || !cardPaymentForm.card) {
      throw new Error('Payment form not initialized');
    }

    // Check if we're in mock/testing mode (Square SDK failed to load)
    if (cardPaymentForm.card.mock || !window.Square) {

      // Simulate a successful payment for testing purposes
      setPaymentInfo(prev => ({
        ...prev,
        cardToken: 'test-token-' + Date.now(),
        cardLast4: '1111',
        cardBrand: 'Visa'
      }));
      
      return { 
        success: true, 
        paymentId: 'test-payment-' + Date.now(),
        mock: true 
      };
    }

    // Check if we're in demo mode (no credentials but Square SDK loaded)
    if (!process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID) {

      // Simulate a successful payment for demo purposes
      setPaymentInfo(prev => ({
        ...prev,
        cardToken: 'demo-token-123',
        cardLast4: '1111',
        cardBrand: 'Visa'
      }));
      
      return { 
        success: true, 
        paymentId: 'demo-payment-' + Date.now(),
        demo: true 
      };
    }

    try {
      const result = await cardPaymentForm.card.tokenize();
      
      if (result.status === 'OK') {
        const paymentResponse = await fetch('/api/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceId: result.token,
            amount: getTotalPrice(),
            customerInfo
          }),
        });

        const paymentData = await paymentResponse.json();
        
        if (paymentData.success) {
          // Update payment info with card details
          setPaymentInfo(prev => ({
            ...prev,
            cardToken: result.token,
            cardLast4: result.details?.card?.last4,
            cardBrand: result.details?.card?.brand
          }));
          
          return { success: true, paymentId: paymentData.paymentId };
        } else {
          console.error('Payment processing failed:', paymentData);
          return { success: false, error: paymentData.error };
        }
      } else {
        console.error('Card tokenization failed:', result.errors);
        return { success: false, error: 'Card tokenization failed' };
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-red-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-red-600">🍕 Losco's Pizzeria</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#menu" className="text-gray-700 hover:text-red-600 transition-colors">Menu</a>
              {galleryImages.length > 0 && (
                <a href="#gallery" className="text-gray-700 hover:text-red-600 transition-colors">Gallery</a>
              )}
              <a href="#about" className="text-gray-700 hover:text-red-600 transition-colors">About</a>
              <a href="#contact" className="text-gray-700 hover:text-red-600 transition-colors">Contact</a>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowCart(true)}
                className="relative bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors"
              >
                Cart ({getTotalCartQuantity()}/2)
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Your Order</h3>
              <button 
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Pickup Only Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800 text-center">
                🚚 Pickup Only - Cash payment upon pickup
              </p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800 text-center">
                Maximum 2 pizzas per order • {getTotalCartQuantity()}/2 used
              </p>
            </div>
            
            <div className="space-y-4 mb-6">
              {pizzaMenu.map(pizza => {
                const cartItem = cart.find(item => item.id === pizza.id);
                const quantity = cartItem?.quantity || 0;
                
                return (
                  <div key={pizza.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-semibold">{pizza.name}</h4>
                      <p className="text-sm text-gray-800">${pizza.price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(pizza.id, quantity - 1)}
                        className="w-8 h-8 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={quantity === 0}
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(pizza.id, quantity + 1)}
                        className="w-8 h-8 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={getTotalCartQuantity() >= 2}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold">Total:</span>
                <span className="text-2xl font-bold text-red-600">${getTotalPrice()}</span>
              </div>
              <button
                onClick={() => {
                  setShowCart(false);
                  setShowOrderForm(true);
                }}
                disabled={getTotalCartQuantity() === 0}
                className="w-full bg-red-600 text-white py-3 rounded-full font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">Complete Your Order</h3>
              <button 
                onClick={() => {
                  setShowOrderForm(false);
                  setDateFieldError(false);
                  setAvailableTimeSlots([]);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Pickup Only Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-green-800 text-center">
                🚚 Pickup Only - We'll call you when your order is ready!
              </p>
            </div>
            
            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  pattern="\(\d{3}\) \d{3}-\d{4}"
                  value={customerInfo.phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${dateFieldError ? 'text-red-600' : 'text-gray-900'}`}>
                  Pickup Date *
                </label>
                <input
                  type="date"
                  required
                  value={customerInfo.orderDate}
                  onChange={handleDateChange}
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  max={new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                    dateFieldError 
                      ? 'border-red-500 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-red-500'
                  }`}
                />
                {dateFieldError && (
                  <p className="text-sm text-red-600 mt-1 font-medium">
                    ⚠️ We are closed on Sundays. Please select Monday-Saturday.
                  </p>
                )}
                {!dateFieldError && (
                  <p className="text-sm text-gray-700 mt-1">Open Monday-Saturday, 4:00 PM - 8:00 PM • Orders must be placed 1 day in advance</p>
                )}
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-900">Pickup Time *</label>
                  {customerInfo.orderDate && !isSunday(customerInfo.orderDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        // Clear cache for this date and refresh
                        const newCache = { ...timeSlotCache };
                        delete newCache[customerInfo.orderDate];
                        setTimeSlotCache(newCache);
                        fetchAvailableTimeSlots(customerInfo.orderDate);
                      }}
                      disabled={loadingTimeSlots}
                      className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      🔄 Refresh
                    </button>
                  )}
                </div>
                <select
                  required
                  value={customerInfo.pickupTime}
                  onChange={handleTimeChange}
                  disabled={loadingTimeSlots || availableTimeSlots.length === 0}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingTimeSlots 
                      ? "Loading available times..." 
                      : availableTimeSlots.length === 0 
                        ? "No times available (select a date first)"
                        : "Select a pickup time"
                    }
                  </option>
                  {availableTimeSlots.map((time) => (
                    <option key={time.value} value={time.value}>
                      {time.display}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-700 mt-1">
                  Operating hours: 4:00 PM - 8:00 PM (20-minute intervals)
                  {availableTimeSlots.length > 0 && (
                    <span className="text-green-600 ml-1">• {availableTimeSlots.length} slots available</span>
                  )}
                  {!loadingTimeSlots && availableTimeSlots.length === 0 && customerInfo.orderDate && !isSunday(customerInfo.orderDate) && (
                    <span className="text-red-600 ml-1">• All slots booked for this date</span>
                  )}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Referral Code *</label>
                <input
                  type="text"
                  required
                  value={customerInfo.referralCode}
                  onChange={(e) => setCustomerInfo({...customerInfo, referralCode: e.target.value})}
                  placeholder="Enter referral code"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Special Requests</label>
                <textarea
                  value={customerInfo.specialRequests}
                  onChange={(e) => setCustomerInfo({...customerInfo, specialRequests: e.target.value})}
                  placeholder="Any special requests, notes, or dietary restrictions for your order..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Payment Method *</label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="cash"
                      name="paymentType"
                      value="cash"
                      checked={paymentInfo.type === 'cash'}
                      onChange={() => setPaymentInfo({ type: 'cash' })}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <label htmlFor="cash" className="ml-3 text-sm text-gray-900">
                      💵 Cash on pickup
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="card"
                      name="paymentType"
                      value="card"
                      checked={paymentInfo.type === 'card'}
                      onChange={() => setPaymentInfo({ type: 'card' })}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <label htmlFor="card" className="ml-3 text-sm text-gray-900">
                      💳 Credit/Debit Card
                    </label>
                  </div>
                </div>

                {/* Square Card Payment Form */}
                {paymentInfo.type === 'card' && (
                  <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Card Information</h4>
                    {squareLoaded ? (
                      <div id="card-container" className="bg-white border border-gray-300 rounded-lg p-3"></div>
                    ) : (
                      <div className="bg-white border border-gray-300 rounded-lg p-3 text-center text-gray-500">
                        Loading payment form...
                      </div>
                    )}
                    <p className="text-xs text-gray-600 mt-2">
                      🔒 Your payment information is secure and encrypted
                    </p>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-red-600">${getTotalPrice()}</span>
                </div>
                {paymentInfo.type === 'cash' ? (
                  <p className="text-sm text-gray-800 mb-4">💵 Payment: Cash on pickup</p>
                ) : (
                  <p className="text-sm text-gray-800 mb-4">💳 Payment: Credit/Debit Card (charged now)</p>
                )}
                
                {/* SMS Consent Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    📱 By placing this order, you consent to receive SMS notifications about your order status. 
                    <a href="/consent" target="_blank" className="underline hover:text-blue-600 ml-1">
                      View our SMS policy
                    </a>
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="w-full bg-red-600 text-white py-3 rounded-full font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmittingOrder ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {orderSubmitted && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-4">Order Confirmed!</h3>
            <p className="text-gray-800 mb-6">
              Thank you for your order!<br />
              Pickup time: {new Date(`2000-01-01T${customerInfo.pickupTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} on {(() => {
                const [year, month, day] = customerInfo.orderDate.split('-').map(Number);
                return new Date(year, month - 1, day).toLocaleDateString();
              })()}<br />
              We'll text you at {customerInfo.phone} with order updates and when it's ready for pickup.
            </p>
            <div className="bg-red-50 p-4 rounded-lg mb-6">
              <p className="font-semibold">Order Total: ${getTotalPrice()}</p>
              {paymentInfo.type === 'cash' ? (
                <p className="text-sm text-gray-800">💵 Pay with cash upon pickup</p>
              ) : (
                <div className="text-sm text-gray-800">
                  <p className="text-green-600 font-medium">💳 Payment Successful!</p>
                  {paymentInfo.cardLast4 && (
                    <p>Card ending in {paymentInfo.cardLast4}</p>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setOrderSubmitted(false);
                setCart([]);
                setCustomerInfo({ name: "", phone: "", email: "", referralCode: "", orderDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], pickupTime: "", specialRequests: "" });
                setPaymentInfo({ type: 'cash' });
                setCardPaymentForm(null);
                setDateFieldError(false);
                setAvailableTimeSlots([]);
                setTimeSlotCache({});
              }}
              className="w-full bg-red-600 text-white py-3 rounded-full font-semibold hover:bg-red-700 transition-colors"
            >
              Thank You!
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 lg:py-11">
          {/* Pickup Only Notice */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <span className="mr-2">🚚</span>
              Pickup Only - Fresh from our oven to your table!
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Losco's Pizzeria
                <span className="text-red-600 block">Exceptionally Handcrafted</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Experience the authentic taste of homemade pizza, crafted with fresh ingredients, 
                organic flour, 2 kinds of mozzarella, and our signature organic tomato sauce.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="#menu"
                  className="bg-red-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  View Menu
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-full w-96 h-96 mx-auto shadow-2xl overflow-hidden">
                <Image
                  src="/gallery/ovenpizza.jpeg"
                  alt="Fresh pizza from the oven"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 320px, 384px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-8">
                  <p className="text-white text-xl font-semibold text-center drop-shadow-lg">
                    Fresh from the Oven
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pizza Showcase */}
      <section id="menu" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Signature Pizzas</h2>
            <p className="text-xl text-gray-600">Each pizza is handcrafted with premium ingredients</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pizzaMenu.map((pizza) => (
              <div key={pizza.id} className={`rounded-2xl p-8 hover:shadow-xl transition-shadow ${
                pizza.id === "margherita" || pizza.id === "yoshi"
                  ? "relative overflow-hidden" 
                  : "bg-gradient-to-br from-red-50 to-red-50"
              }`}>
                {pizza.id === "margherita" ? (
                  <>
                    {/* Background image for Classic Margherita */}
                    <div className="absolute inset-0 z-0">
                      <img
                        src="/cheese2.jpg"
                        alt="Classic Margherita Pizza"
                        className="w-full h-full object-cover scale-125"
                      />
                    </div>
                    {/* Content with white background for readability - positioned lower */}
                    <div className="relative z-10 bg-white bg-opacity-95 rounded-xl p-6 -m-2 mt-16">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{pizza.name}</h3>
                      <p className="text-gray-600 mb-4">{pizza.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-red-600">${pizza.price}</span>
                        <button 
                          onClick={() => addToCart(pizza)}
                          className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
                        >
                          Add to Order
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Background image for Yoshi's Weekly Special */}
                    <div className="absolute inset-0 z-0">
                      <img
                        src="/gallery/pepperonibasil.jpeg"
                        alt="Yoshi's Weekly Special Pizza"
                        className="w-full h-full object-cover scale-125"
                      />
                    </div>
                    {/* Yoshi image in top right */}
                    <div className="absolute top-8 right-4 z-20">
                      <div className="relative rounded-full w-24 h-24 shadow-lg overflow-hidden bg-red-600">
                        <img
                          src="/yoshi.png"
                          alt="Yoshi"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    {/* Content with white background for readability - positioned lower */}
                    <div className="relative z-10 bg-white bg-opacity-95 rounded-xl p-6 -m-2 mt-16">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{pizza.name}</h3>
                      <p className="text-gray-600 mb-4">{pizza.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-red-600">${pizza.price}</span>
                        <button 
                          onClick={() => addToCart(pizza)}
                          className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
                        >
                          Add to Order
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <section id="gallery" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Pizza Gallery</h2>
              <p className="text-xl text-gray-600">See our handcrafted pizzas in all their delicious glory</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {galleryImages.map((image, index) => (
                <div 
                  key={index}
                  className="group cursor-pointer overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={image}
                      alt={`Pizza ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-10"
            >
              ×
            </button>
            <img
              src={selectedImage}
              alt="Pizza"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-red-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Choose Our Homemade Pizza?</h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-red-600 text-white p-2 rounded-full">
                    <span className="text-xl">🌾</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Fresh Ingredients</h3>
                    <p className="text-gray-600">We source only the finest ingredients for exceptional flavor.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-red-600 text-white p-2 rounded-full">
                    <span className="text-xl">👨‍🍳</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Handcrafted</h3>
                    <p className="text-gray-600">Each pizza is made by hand, following traditional Italian techniques.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-red-600 text-white p-2 rounded-full">
                    <span className="text-xl">🔥</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Expertly-Fired</h3>
                    <p className="text-gray-600">Cooked in our authentic pizza oven over 600 degrees for that perfect crust.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-xl">
                <div className="text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Family Recipe</h3>
                  <p className="text-gray-600 mb-6">
                    Our pizza recipe has been perfected over 10 years, 
                    ensuring every bite delivers the authentic taste of homemade goodness.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-red-600">50+</div>
                      <div className="text-sm text-gray-600">Happy Customers</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">2</div>
                      <div className="text-sm text-gray-600">Pizza Varieties</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">15min</div>
                      <div className="text-sm text-gray-600">Average Wait</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Taste the Difference?</h2>
          <p className="text-xl text-red-100 mb-8">
            Order now and experience the authentic taste of homemade pizza for pickup.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setShowCart(true)}
              className="bg-white text-red-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Order Online
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-green-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-green-300 mb-4">🍕 Losco's Pizzeria</h3>
              <p className="text-green-100">
                Bringing you the authentic taste of homemade pizza, 
                crafted with love and tradition.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4 text-green-200">Hours</h4>
              <div className="space-y-2 text-green-100">
                <p>Mon-Sat: 4PM - 8PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>
          <div className="border-t border-green-700 mt-8 pt-8 text-center text-green-200">
            <p>&copy; 2025 Losco's Pizzeria. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

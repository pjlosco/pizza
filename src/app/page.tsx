"use client";

import { useState } from "react";
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
    orderDate: new Date().toISOString().split('T')[0]
  });
  const [orderSubmitted, setOrderSubmitted] = useState(false);

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

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number
    if (!validatePhoneNumber(customerInfo.phone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    
    // Prepare order data
    const orderDetails = {
      customer: customerInfo,
      items: cart,
      total: getTotalPrice(),
      orderTime: new Date().toLocaleString()
    };
    
    try {
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
        console.log("Order submitted successfully:", orderDetails);
      } else {
        alert("Failed to submit order. Please try again.");
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert("Failed to submit order. Please try again.");
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
                      <p className="text-sm text-gray-600">${pizza.price}</p>
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
                onClick={() => setShowOrderForm(false)}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  pattern="\(\d{3}\) \d{3}-\d{4}"
                  value={customerInfo.phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date *</label>
                <input
                  type="date"
                  required
                  value={customerInfo.orderDate}
                  onChange={(e) => setCustomerInfo({...customerInfo, orderDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  max={new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">Select a date between today and 4 weeks from now</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code *</label>
                <input
                  type="text"
                  required
                  value={customerInfo.referralCode}
                  onChange={(e) => setCustomerInfo({...customerInfo, referralCode: e.target.value})}
                  placeholder="Enter referral code"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-red-600">${getTotalPrice()}</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">Payment: Cash on pickup</p>
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3 rounded-full font-semibold hover:bg-red-700 transition-colors"
                >
                  Place Order
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
            <p className="text-gray-600 mb-6">
              Thank you for your order! We'll call you at {customerInfo.phone} when your pizza is ready for pickup.
            </p>
            <div className="bg-red-50 p-4 rounded-lg mb-6">
              <p className="font-semibold">Order Total: ${getTotalPrice()}</p>
              <p className="text-sm text-gray-600">Pay with cash upon pickup</p>
            </div>
            <button
              onClick={() => {
                setOrderSubmitted(false);
                setCart([]);
                setCustomerInfo({ name: "", phone: "", email: "", referralCode: "", orderDate: new Date().toISOString().split('T')[0] });
              }}
              className="w-full bg-red-600 text-white py-3 rounded-full font-semibold hover:bg-red-700 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
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
              <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-full w-96 h-96 mx-auto flex items-center justify-center shadow-2xl">
                <div className="text-white text-center">
                  <div className="text-8xl mb-4">🍕</div>
                  <p className="text-xl font-semibold">Fresh from the Oven</p>
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
              <div key={pizza.id} className="bg-gradient-to-br from-red-50 to-red-50 rounded-2xl p-8 hover:shadow-xl transition-shadow">
                <div className="text-6xl mb-4">🍕</div>
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
            ))}
          </div>
        </div>
      </section>

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
                <p>Mon-Fri: 11AM - 10PM</p>
                <p>Sat-Sun: 12PM - 11PM</p>
              </div>
            </div>
          </div>
          <div className="border-t border-green-700 mt-8 pt-8 text-center text-green-200">
            <p>&copy; 2024 Losco's Pizzeria. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

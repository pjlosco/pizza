# Manual Testing Checklist for Cash Payment Functionality

## 🧪 Test Instructions

Open your browser and navigate to `http://localhost:3000` to test the cash payment functionality.

## ✅ Test Steps

### 1. **Initial Page Load**
- [ ] Open http://localhost:3000
- [ ] Verify the page loads without errors
- [ ] Check that you can see the pizza menu items

### 2. **Add Item to Cart**
- [ ] Click "Add to Order" on any pizza
- [ ] Verify the cart count increases
- [ ] Click the "Cart" button to open the cart modal

### 3. **Check Cart Notice**
- [ ] In the cart modal, look for the green notice box
- [ ] **VERIFY**: The text should say "🚚 Pickup Only - Cash or Credit/Debit card payment accepted"
- [ ] **NOT**: "Credit/Debit card payment required" (this would indicate the old version)

### 4. **Proceed to Checkout**
- [ ] Click "Proceed to Order" button
- [ ] Verify the checkout form opens

### 5. **Payment Method Selection**
- [ ] Look for the "Payment Method" section
- [ ] **VERIFY**: You should see TWO radio button options:
  - [ ] 💵 Cash on pickup
  - [ ] 💳 Credit/Debit Card
- [ ] **VERIFY**: "💵 Cash on pickup" should be **pre-selected** (checked by default)

### 6. **Test Payment Method Switching**
- [ ] Click on "💳 Credit/Debit Card" radio button
- [ ] **VERIFY**: The Square payment form appears below
- [ ] Click back on "💵 Cash on pickup" radio button
- [ ] **VERIFY**: The Square payment form disappears

### 7. **Fill Out Customer Information**
- [ ] Enter a name (e.g., "Test Customer")
- [ ] Enter a phone number (e.g., "555-123-4567")
- [ ] Enter an email (e.g., "test@example.com")
- [ ] Enter a referral code (e.g., "TEST123")
- [ ] Select a pickup date (tomorrow or later, not Sunday)
- [ ] Select a pickup time from the dropdown

### 8. **Submit Order with Cash Payment**
- [ ] Make sure "💵 Cash on pickup" is selected
- [ ] Click "Place Order" button
- [ ] **VERIFY**: Order should submit successfully
- [ ] **VERIFY**: Success modal should appear

### 9. **Check Success Message**
- [ ] In the success modal, look for the payment information
- [ ] **VERIFY**: Should see "💵 Pay with cash upon pickup"
- [ ] **NOT**: Should NOT see "💳 Payment Successful!" or card details

### 10. **Test Form Reset**
- [ ] Click "Thank You!" to close the success modal
- [ ] Add another item to cart and go through checkout again
- [ ] **VERIFY**: "💵 Cash on pickup" should be selected by default again

## 🐛 Expected Results

### ✅ What Should Work:
- Cash payment option is visible and selectable
- Cash is selected by default
- Orders can be submitted with cash payment
- Success message mentions cash payment
- Form resets to cash payment by default

### ❌ What Should NOT Happen:
- Error messages about "Only credit/debit card payments are accepted"
- Cash payment option missing or commented out
- Card payment selected by default
- Payment processing errors when using cash

## 🔍 Debugging

If tests fail, check the browser console (F12) for any error messages and note them below:

**Console Errors:**
```
[Add any error messages here]
```

**Failed Test Steps:**
```
[Note which steps failed and what happened]
```

## 📝 Test Results

**Date:** _______________
**Tester:** _______________

**Overall Result:** 
- [ ] ✅ All tests passed - Cash payment functionality is working correctly
- [ ] ❌ Some tests failed - Issues need to be addressed

**Notes:**
```
[Add any additional observations or issues found]
``` 
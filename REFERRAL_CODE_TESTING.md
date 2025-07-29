# Referral Code Testing Checklist

## 🧪 Test Instructions

Open your browser and navigate to `http://localhost:3000` to test the new referral code validation logic.

## ✅ Test Scenarios

### Test 1: Cash Payment with Valid Referral Code
- [ ] Add item to cart and proceed to checkout
- [ ] Select "💵 Cash on pickup" payment method
- [ ] **VERIFY**: Referral code field shows "*" (required)
- [ ] **VERIFY**: Placeholder says "Enter your referral code"
- [ ] **VERIFY**: Description says "A valid referral code is required for cash payments"
- [ ] Enter a valid referral code (e.g., "patrick", "mila", "rola")
- [ ] Fill out all other required fields
- [ ] Click "Place Order"
- [ ] **VERIFY**: Order submits successfully

### Test 2: Cash Payment with Invalid Referral Code
- [ ] Add item to cart and proceed to checkout
- [ ] Select "💵 Cash on pickup" payment method
- [ ] Enter an invalid referral code (e.g., "invalid", "test123")
- [ ] Fill out all other required fields
- [ ] Click "Place Order"
- [ ] **VERIFY**: Error message appears: "Invalid referral code. Please check your code and try again."

### Test 3: Cash Payment with No Referral Code
- [ ] Add item to cart and proceed to checkout
- [ ] Select "💵 Cash on pickup" payment method
- [ ] Leave referral code field empty
- [ ] Fill out all other required fields
- [ ] Click "Place Order"
- [ ] **VERIFY**: Error message appears: "Please enter a referral code for cash payments."

### Test 4: Card Payment with No Referral Code (Should Work)
- [ ] Add item to cart and proceed to checkout
- [ ] Select "💳 Credit/Debit Card" payment method
- [ ] **VERIFY**: Referral code field does NOT show "*" (not required)
- [ ] **VERIFY**: Placeholder says "Optional referral code"
- [ ] **VERIFY**: Description says "Optional referral code for special offers"
- [ ] Leave referral code field empty
- [ ] Fill out all other required fields
- [ ] Click "Place Order"
- [ ] **VERIFY**: Order submits successfully (no referral code required)

### Test 5: Card Payment with Valid Referral Code (Should Work)
- [ ] Add item to cart and proceed to checkout
- [ ] Select "💳 Credit/Debit Card" payment method
- [ ] Enter a valid referral code (e.g., "patrick", "mila", "rola")
- [ ] Fill out all other required fields
- [ ] Click "Place Order"
- [ ] **VERIFY**: Order submits successfully

### Test 6: Card Payment with Invalid Referral Code (Should Work)
- [ ] Add item to cart and proceed to checkout
- [ ] Select "💳 Credit/Debit Card" payment method
- [ ] Enter an invalid referral code (e.g., "invalid", "test123")
- [ ] Fill out all other required fields
- [ ] Click "Place Order"
- [ ] **VERIFY**: Order submits successfully (referral code is optional for cards)

### Test 7: Switching Payment Methods
- [ ] Add item to cart and proceed to checkout
- [ ] Select "💵 Cash on pickup" payment method
- [ ] **VERIFY**: Referral code field shows as required
- [ ] Switch to "💳 Credit/Debit Card" payment method
- [ ] **VERIFY**: Referral code field no longer shows as required
- [ ] Switch back to "💵 Cash on pickup" payment method
- [ ] **VERIFY**: Referral code field shows as required again

## 🎯 Expected Behavior Summary

### Cash Payments:
- ✅ **Referral code is REQUIRED**
- ✅ **Must be a valid code** (patrick, mila, rola)
- ✅ **Shows "*" in label**
- ✅ **Shows "required" in description**
- ✅ **Shows "Enter your referral code" placeholder**

### Card Payments:
- ✅ **Referral code is OPTIONAL**
- ✅ **Can be empty, valid, or invalid**
- ✅ **Does NOT show "*" in label**
- ✅ **Shows "optional" in description**
- ✅ **Shows "Optional referral code" placeholder**

## 🐛 If Tests Fail

**Check the browser console (F12) for error messages and note them below:**

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
- [ ] ✅ All tests passed - Referral code validation working correctly
- [ ] ❌ Some tests failed - Issues need to be addressed

**Notes:**
```
[Add any additional observations or issues found]
``` 
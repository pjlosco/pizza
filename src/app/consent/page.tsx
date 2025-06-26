export default function ConsentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-2xl bg-white rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍕</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">SMS Consent Policy</h1>
          <p className="text-lg text-gray-600">Losco's Pizzeria</p>
        </div>
        
        <div className="space-y-6 text-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">SMS Communications Consent</h2>
            <p className="mb-4">
              By providing your phone number when placing an order, you consent to receive SMS notifications from Losco's Pizzeria regarding your order status and pickup information.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">What We Send:</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Order confirmation messages</li>
              <li>Pickup time notifications</li>
              <li>Order status updates</li>
              <li>Important order-related information</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Opt-Out Information:</h3>
            <p>
              You can opt out of SMS communications at any time by replying "STOP" to any message or contacting us directly.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Frequency:</h3>
            <p>
              Messages are sent only when you place an order and for order-related updates. We do not send marketing messages without explicit consent.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Information:</h3>
            <p>
              <strong>Business:</strong> Losco's Pizzeria<br/>
              <strong>Service:</strong> Twilio SMS<br/>
              <strong>Purpose:</strong> Order notifications and customer service
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="/"
            className="bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition-colors"
          >
            Return to Homepage
          </a>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
} 
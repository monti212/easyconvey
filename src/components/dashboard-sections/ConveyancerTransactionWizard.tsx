import React, { useState } from 'react';
import { X, User, Building2, Users, ArrowRight } from 'lucide-react';
import TransactionWizard from '../TransactionWizard';
import { useTransactions } from '../../App';

interface ConveyancerTransactionWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConveyancerTransactionWizard: React.FC<ConveyancerTransactionWizardProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedOption, setSelectedOption] = useState<'buyer' | 'seller' | 'both' | null>(null);
  const [buyerTransactionId, setBuyerTransactionId] = useState<string | null>(null);
  const [sellerTransactionId, setSellerTransactionId] = useState<string | null>(null);
  const { addTransaction } = useTransactions();

  const handleOptionSelect = (option: 'buyer' | 'seller' | 'both') => {
    setSelectedOption(option);
    
    if (option === 'buyer' || option === 'both') {
      const buyerId = Math.random().toString(36).substring(2, 10).toUpperCase();
      setBuyerTransactionId(buyerId);
      
      const buyerTransaction = {
        id: buyerId,
        type: 'buying',
        submissionDate: new Date().toISOString().split('T')[0],
        lastUpdate: new Date().toISOString(),
        status: 'Step 1: Agent Information',
        progress: 0,
        priority: 'medium',
        currentStep: 1,
        totalSteps: 7,
        stepName: 'Agent Information',
        isCompleted: false,
        isActive: true,
        lastActivityTime: new Date().toISOString(),
        buyerName: 'In Progress...',
        sellerName: 'In Progress...',
        propertyPrice: 0,
        nationality: 'Unknown',
        hasAgent: false,
        entityType: 'unknown',
        stepProgress: {
          1: {
            stepName: 'Agent Information',
            isCompleted: false
          }
        },
        fullData: {}
      };
      
      addTransaction(buyerTransaction);
    }
    
    if (option === 'seller' || option === 'both') {
      const sellerId = Math.random().toString(36).substring(2, 10).toUpperCase();
      setSellerTransactionId(sellerId);
      
      const sellerTransaction = {
        id: sellerId,
        type: 'selling',
        submissionDate: new Date().toISOString().split('T')[0],
        lastUpdate: new Date().toISOString(),
        status: 'Step 1: Agent Information',
        progress: 0,
        priority: 'medium',
        currentStep: 1,
        totalSteps: 7,
        stepName: 'Agent Information',
        isCompleted: false,
        isActive: true,
        lastActivityTime: new Date().toISOString(),
        buyerName: 'In Progress...',
        sellerName: 'In Progress...',
        propertyPrice: 0,
        nationality: 'Unknown',
        hasAgent: false,
        entityType: 'unknown',
        stepProgress: {
          1: {
            stepName: 'Agent Information',
            isCompleted: false
          }
        },
        fullData: {}
      };
      
      addTransaction(sellerTransaction);
    }
  };

  const handleClose = () => {
    setSelectedOption(null);
    setBuyerTransactionId(null);
    setSellerTransactionId(null);
    onClose();
  };

  if (!isOpen) return null;

  // Show transaction type selection
  if (!selectedOption) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-dark p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-serif font-bold text-white">New Transaction</h2>
                <p className="text-gray-200 text-sm">Choose the transaction type to begin</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-200 hover:text-white hover:bg-primary-light rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-serif font-bold text-primary mb-2">Select Transaction Type</h3>
              <p className="text-gray-600">
                Choose whether you're handling a buyer, seller, or both parties in this transaction
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Buyer Transaction */}
              <button
                onClick={() => handleOptionSelect('buyer')}
                className="group flex flex-col items-center p-8 border-2 border-gray-200 rounded-2xl hover:border-primary hover:shadow-soft transition-all duration-300"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                  <User className="h-10 w-10 text-green-600" />
                </div>
                <h4 className="text-lg font-serif font-semibold text-primary mb-2">Buyer Transaction</h4>
                <p className="text-sm text-gray-600 text-center">
                  Handle a buyer's complete property purchase process
                </p>
              </button>

              {/* Seller Transaction */}
              <button
                onClick={() => handleOptionSelect('seller')}
                className="group flex flex-col items-center p-8 border-2 border-gray-200 rounded-2xl hover:border-primary hover:shadow-soft transition-all duration-300"
              >
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <Building2 className="h-10 w-10 text-blue-600" />
                </div>
                <h4 className="text-lg font-serif font-semibold text-primary mb-2">Seller Transaction</h4>
                <p className="text-sm text-gray-600 text-center">
                  Handle a seller's complete property sale process
                </p>
              </button>

              {/* Both Parties */}
              <button
                onClick={() => handleOptionSelect('both')}
                className="group flex flex-col items-center p-8 border-2 border-secondary bg-secondary/5 rounded-2xl hover:border-secondary-dark hover:shadow-soft transition-all duration-300"
              >
                <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-secondary/30 transition-colors">
                  <Users className="h-10 w-10 text-secondary-dark" />
                </div>
                <h4 className="text-lg font-serif font-semibold text-primary mb-2">Both Parties</h4>
                <p className="text-sm text-gray-600 text-center">
                  Handle both buyer and seller in the same transaction
                </p>
                <div className="mt-2 px-3 py-1 bg-secondary/20 text-secondary-dark text-xs rounded-full font-medium">
                  Recommended
                </div>
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                All transaction types use the same guided process as the main platform
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the transaction wizard(s) based on selection
  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={handleClose}
                className="mr-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ← Back to Dashboard
              </button>
              <div>
                <h1 className="text-xl font-serif font-bold text-primary">
                  {selectedOption === 'buyer' ? 'Buyer Transaction' :
                   selectedOption === 'seller' ? 'Seller Transaction' :
                   'Buyer & Seller Transaction'}
                </h1>
                <p className="text-sm text-gray-600">Conveyancer-initiated transaction</p>
              </div>
            </div>

            {selectedOption === 'both' && (
              <div className="flex items-center space-x-4">
                {buyerTransactionId && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                    Buyer: {buyerTransactionId}
                  </span>
                )}
                {sellerTransactionId && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    Seller: {sellerTransactionId}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {selectedOption === 'both' ? (
          /* Both parties side by side */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Buyer Side */}
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-center">
                <h3 className="text-lg font-serif font-bold text-white">Buyer Process</h3>
                <p className="text-green-100 text-sm">Transaction ID: {buyerTransactionId}</p>
              </div>
              <div className="p-6">
                {buyerTransactionId && (
                  <TransactionWizard 
                    transactionId={buyerTransactionId}
                    sharedTransactionData={{
                      transactionId: buyerTransactionId,
                      transactionType: 'buying',
                      isSharedLink: false
                    }}
                  />
                )}
              </div>
            </div>

            {/* Seller Side */}
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-center">
                <h3 className="text-lg font-serif font-bold text-white">Seller Process</h3>
                <p className="text-blue-100 text-sm">Transaction ID: {sellerTransactionId}</p>
              </div>
              <div className="p-6">
                {sellerTransactionId && (
                  <TransactionWizard 
                    transactionId={sellerTransactionId}
                    sharedTransactionData={{
                      transactionId: sellerTransactionId,
                      transactionType: 'selling',
                      isSharedLink: false
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Single party */
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
              <div className={`p-4 text-center ${
                selectedOption === 'buyer' 
                  ? 'bg-gradient-to-r from-green-600 to-green-700' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700'
              }`}>
                <h3 className="text-lg font-serif font-bold text-white">
                  {selectedOption === 'buyer' ? 'Buyer' : 'Seller'} Transaction Process
                </h3>
                <p className={`text-sm ${selectedOption === 'buyer' ? 'text-green-100' : 'text-blue-100'}`}>
                  Transaction ID: {selectedOption === 'buyer' ? buyerTransactionId : sellerTransactionId}
                </p>
              </div>
              <div className="p-6">
                <TransactionWizard 
                  transactionId={selectedOption === 'buyer' ? buyerTransactionId : sellerTransactionId}
                  sharedTransactionData={{
                    transactionId: selectedOption === 'buyer' ? buyerTransactionId || '' : sellerTransactionId || '',
                    transactionType: selectedOption === 'buyer' ? 'buying' : 'selling',
                    isSharedLink: false
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConveyancerTransactionWizard;
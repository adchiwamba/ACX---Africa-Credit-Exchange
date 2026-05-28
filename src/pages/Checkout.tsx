import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFirebase } from '../components/FirebaseProvider';
import { firestoreService } from '../services/firestoreService';
import { StockItem, LoanStatus } from '../types';
import { 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  Package, 
  AlertCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile: user } = useFirebase();
  const productId = searchParams.get('productId');

  const [product, setProduct] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock global inventory lookup for demo purposes
  // In real implementation, this would be a Firestore query across all lenders
  const MOCK_INVENTORY: StockItem[] = [
    { id: 'prod_1', name: 'Smart Solar Kit X1', category: 'Energy', price: 1250, currency: 'USD', description: 'Complete off-grid home solar solution with battery back-up.', stockQuantity: 45, lowStockThreshold: 10, barcode: '7890123456' },
    { id: 'prod_2', name: 'Precision Ag-Drone', category: 'Agriculture', price: 3400, currency: 'USD', description: 'Multispectral imaging drone for crop health assessment.', stockQuantity: 12, lowStockThreshold: 15, barcode: '7890123457' },
    { id: 'prod_3', name: 'Point-of-Sale Hub', category: 'Retail', price: 450, currency: 'USD', description: 'Integrated payment and inventory management hardware.', stockQuantity: 89, lowStockThreshold: 20, barcode: '7890123458' },
  ];

  useEffect(() => {
    if (productId) {
      // Simulate API fetch delay
      const timer = setTimeout(() => {
        const found = MOCK_INVENTORY.find(item => item.id === productId);
        setProduct(found || null);
        setLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [productId]);

  const handleApplyCredit = async () => {
    if (!product || !user) return;
    
    setIsProcessing(true);
    try {
      // Create a loan request specifically for this asset
      await firestoreService.createLoan({
        borrowerId: user.uid,
        amount: product.price,
        currency: product.currency || 'USD',
        purpose: `Instant Credit Purchase: ${product.name}`,
        durationMonths: 12,
        interestRate: 15,
        status: LoanStatus.PENDING,
        creditScoreSnapshot: user.creditScore || 650,
        alternativeDataMetrics: {
          scannedCheckout: true,
          assetCategory: product.category,
          source: 'QR_DEEP_LINK'
        }
      });

      alert(`Success! Your credit application for the ${product.name} has been submitted for review.`);
      navigate('/portfolio');
    } catch (error) {
      console.error("Purchase failed:", error);
      alert("Failed to process credit application. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-guava-orange border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Authenticating Asset Link...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter text-guava-dark">Asset Record Not Found</h2>
            <p className="text-sm text-gray-500 mt-2">The scanned barcode or link appears to be invalid or has expired from our active registry.</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-guava-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-guava-orange transition-all"
          >
            Return to Terminal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-guava-dark mb-8 group transition-all"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Discard Scan
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Details */}
        <div className="space-y-8">
          <div className="relative aspect-square bg-gray-50 rounded-[48px] overflow-hidden border border-gray-100 p-8 flex items-center justify-center">
             <Package className="w-32 h-32 text-gray-200" />
             <div className="absolute top-8 left-8">
               <span className="px-3 py-1.5 bg-white shadow-sm border border-gray-100 rounded-xl text-[10px] font-black text-guava-dark uppercase tracking-widest">
                 {product.category}
               </span>
             </div>
          </div>

          <div>
             <h1 className="text-4xl font-black italic tracking-tighter text-guava-dark leading-none mb-4">{product.name}</h1>
             <p className="text-sm text-gray-500 leading-relaxed font-medium">{product.description}</p>
          </div>

          <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-[32px] border border-gray-100">
             <div className="flex-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Asset Value</p>
                <p className="text-3xl font-black italic text-guava-dark">${product.price.toLocaleString()}</p>
             </div>
             <div className="w-px h-12 bg-gray-200" />
             <div className="flex-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Currency</p>
                <p className="text-3xl font-black italic text-guava-orange">{product.currency}</p>
             </div>
          </div>
        </div>

        {/* Credit Flow */}
        <div className="space-y-8">
          <div className="p-10 bg-guava-dark text-white rounded-[48px] shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-10 h-10 bg-guava-orange rounded-2xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black italic tracking-tighter">Buy on Credit</h3>
                      <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Powered by ACX Instant-Liquidity</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex justify-between items-center py-4 border-b border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Estimated APR</span>
                      <span className="text-sm font-black italic text-guava-green">15.0% Fixed</span>
                   </div>
                   <div className="flex justify-between items-center py-4 border-b border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Tenure</span>
                      <span className="text-sm font-black italic">12 Months</span>
                   </div>
                   <div className="flex justify-between items-center py-4 border-b border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Monthly Installment</span>
                      <span className="text-sm font-black italic text-guava-orange">${(product.price * 1.15 / 12).toFixed(2)}</span>
                   </div>
                </div>

                <button 
                  onClick={handleApplyCredit}
                  disabled={isProcessing}
                  className="w-full mt-12 py-5 bg-guava-orange text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-white hover:text-guava-dark transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing Application...' : 'Initiate Buy on Credit'}
                  {!isProcessing && <ChevronRight className="w-4 h-4" />}
                </button>
             </div>

             {/* Background Decoration */}
             <div className="absolute -top-20 -right-20 w-64 h-64 bg-guava-orange/20 rounded-full blur-[80px]" />
          </div>

          <div className="p-8 bg-white border border-gray-100 rounded-[32px] space-y-4">
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-guava-green/10 text-guava-green rounded-xl flex items-center justify-center shrink-0">
                   <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-guava-dark">Smart Protection</p>
                   <p className="text-[11px] text-gray-500 font-medium leading-relaxed">This purchase is insured against structural defects and synchronized with your digital identity.</p>
                </div>
             </div>
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                   <Clock className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-guava-dark">Instant Decision</p>
                   <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Most credit applications are audited and decided within 15 minutes of submission.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

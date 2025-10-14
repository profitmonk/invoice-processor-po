import { useNavigate } from 'react-router-dom';
import { useAuth } from 'wasp/client/auth';
import { useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  FileText,
  ShoppingCart,
  CheckCircle,
  BarChart3,
  Building2,
  Zap,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  DollarSign,
  Shield,
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { data: user } = useAuth();

  // If logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: <FileText className="h-8 w-8" />,
      title: 'Smart Invoice Processing',
      description: 'AI-powered OCR extracts data automatically. Manual entry option for complete control.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: <ShoppingCart className="h-8 w-8" />,
      title: 'Purchase Order Management',
      description: 'Create, track, and approve POs with customizable multi-level approval workflows.',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: <CheckCircle className="h-8 w-8" />,
      title: 'Invoice-PO Linking',
      description: 'Automatically match invoices to purchase orders for complete spend tracking.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: 'Multi-Property Tracking',
      description: 'Track expenses across multiple properties with customizable GL account coding.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Role-Based Access',
      description: 'Property managers, accounting, corporate - each role sees exactly what they need.',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: 'Real-Time Analytics',
      description: 'Track spending patterns, payment status, and budget utilization in real-time.',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
  ];

  const workflow = [
    {
      step: '1',
      title: 'Upload Invoices',
      description: 'Drag & drop PDFs or images. OCR extracts data automatically.',
      icon: <FileText className="h-6 w-6" />,
    },
    {
      step: '2',
      title: 'Review & Link',
      description: 'System suggests matching POs. Review and approve with one click.',
      icon: <ShoppingCart className="h-6 w-6" />,
    },
    {
      step: '3',
      title: 'Get Approvals',
      description: 'Automatic routing based on amount thresholds and expense types.',
      icon: <CheckCircle className="h-6 w-6" />,
    },
    {
      step: '4',
      title: 'Track Payment',
      description: 'Mark as paid, track aging, monitor cash flow.',
      icon: <DollarSign className="h-6 w-6" />,
    },
  ];

  const stats = [
    { label: 'Hours Saved Weekly', value: '15+' },
    { label: 'Processing Accuracy', value: '99%' },
    { label: 'Faster Approvals', value: '3x' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold">
                <span className="text-blue-600">Invoice</span>
                <span className="text-gray-900">Flow</span>
              </h1>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/signup')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6 bg-blue-600 text-white px-4 py-2">
              <Zap className="h-4 w-4 mr-2" />
              AI-Powered Invoice & PO Management
            </Badge>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl">
              Streamline Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Invoice Workflow
              </span>
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-600">
              Complete invoice and purchase order management for multi-property operations. 
              OCR automation, approval workflows, and real-time tracking - all in one platform.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/signup')} className="text-lg px-8 py-6">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="text-lg px-8 py-6">
                Sign In
              </Button>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              No credit card required • 14-day free trial • Setup in minutes
            </p>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <div key={index}>
                  <p className="text-4xl font-bold text-blue-600">{stat.value}</p>
                  <p className="mt-2 text-sm text-gray-600">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, Powerful Workflow
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From invoice receipt to payment in 4 easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflow.map((step, index) => (
              <div key={index} className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white text-xl font-bold">
                    {step.step}
                  </div>
                  <div className="text-blue-600">{step.icon}</div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                {index < workflow.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full border-t-2 border-dashed border-gray-300 -ml-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything You Need
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Built for multi-property management and operations teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-16 h-16 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <div className={feature.color}>{feature.icon}</div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Trust Signals */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Why Teams Choose InvoiceFlow
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Clock className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle>Save Time</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Reduce invoice processing time by 80% with automated OCR and smart PO matching.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Stay Compliant</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Built-in approval workflows ensure proper authorization and audit trails.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle>Gain Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Real-time analytics help you understand spending patterns and optimize costs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Ready to Transform Your Invoice Management?
          </h2>
          <p className="mt-6 text-xl text-blue-100">
            Join property management teams and operations leaders who trust InvoiceFlow
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={() => navigate('/signup')} className="text-lg px-8 py-6">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <p className="mt-6 text-sm text-blue-100">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Building2 className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-semibold">InvoiceFlow</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-400">
              <button onClick={() => navigate('/pricing')} className="hover:text-white transition">
                Pricing
              </button>
              <button onClick={() => navigate('/login')} className="hover:text-white transition">
                Sign In
              </button>
              <button onClick={() => navigate('/signup')} className="hover:text-white transition">
                Sign Up
              </button>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 InvoiceFlow. Built for property management and operations teams.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

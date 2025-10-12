import { useState } from 'react';
import { useQuery, getManualInvoices, deleteManualInvoice } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Plus, Search, FileText, Eye, Trash2, CheckCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';

export default function ManualInvoicesPage() {
  const navigate = useNavigate();
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: invoices, isLoading, refetch } = useQuery(getManualInvoices, {
    paymentStatus: paymentFilter === 'ALL' ? undefined : (paymentFilter as 'PAID' | 'PENDING'),
  });

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}?`)) {
      return;
    }

    try {
      await deleteManualInvoice({ id });
      setMessage({ type: 'success', text: 'Invoice deleted successfully' });
      refetch();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete invoice' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getPaymentStatus = (invoice: any) => {
    const structuredData = invoice.structuredData || {};
    return structuredData.paymentStatus || 'PENDING';
  };

  const filteredInvoices = invoices?.filter((inv: any) => {
    const matchesSearch =
      inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.vendorName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="py-10 lg:mt-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manual Invoices</h1>
            <p className="text-muted-foreground mt-2">
              Create and manage manual invoice entries
            </p>
          </div>
          <Button onClick={() => navigate('/invoices/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle>All Invoices</CardTitle>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select 
                  value={paymentFilter}
                  onValueChange={(value) => setPaymentFilter(value as 'ALL' | 'PAID' | 'PENDING')}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading invoices...</p>
            ) : filteredInvoices && filteredInvoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice: any) => {
                    const paymentStatus = getPaymentStatus(invoice);
                    return (
                      <TableRow 
                        key={invoice.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/invoices/manual/${invoice.id}`)}
                      >
                        <TableCell className="font-mono font-bold">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {invoice.invoiceDate ? formatDate(invoice.invoiceDate) : 'N/A'}
                        </TableCell>
                        <TableCell>{invoice.vendorName || 'N/A'}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(invoice.totalAmount || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                            {paymentStatus === 'PAID' ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Paid
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/invoices/manual/${invoice.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {paymentStatus !== 'PAID' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(invoice.id, invoice.invoiceNumber);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No invoices found</h3>
                <p className="text-muted-foreground mt-2">
                  {searchTerm || paymentFilter !== 'ALL'
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first invoice'}
                </p>
                {!searchTerm && paymentFilter === 'ALL' && (
                  <Button className="mt-4" onClick={() => navigate('/invoices/new')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

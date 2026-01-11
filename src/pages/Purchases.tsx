import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Truck } from 'lucide-react';
import { Product, Purchase, PurchaseItem } from '@/types';
import { getProducts, getPurchases, createPurchase } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Purchases() {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('');
  const [supplier, setSupplier] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(getProducts());
    setPurchases(getPurchases().sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    const product = products.find(p => p.id === productId);
    if (product) {
      setUnitCost(product.costPrice.toString());
    }
  };

  const handleAddItem = () => {
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const qty = parseInt(quantity);
    const cost = parseFloat(unitCost);

    if (qty <= 0 || cost <= 0) {
      toast({
        title: 'Valores inválidos',
        description: 'Quantidade e custo devem ser maiores que zero',
        variant: 'destructive',
      });
      return;
    }

    const existingIndex = purchaseItems.findIndex(item => item.productId === product.id);

    if (existingIndex >= 0) {
      const newItems = [...purchaseItems];
      const newQty = newItems[existingIndex].quantity + qty;
      newItems[existingIndex].quantity = newQty;
      newItems[existingIndex].unitCost = cost;
      newItems[existingIndex].total = newQty * cost;
      setPurchaseItems(newItems);
    } else {
      setPurchaseItems([
        ...purchaseItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: qty,
          unitCost: cost,
          total: qty * cost,
        },
      ]);
    }

    setSelectedProduct('');
    setQuantity('1');
    setUnitCost('');
  };

  const handleRemoveItem = (productId: string) => {
    setPurchaseItems(purchaseItems.filter(item => item.productId !== productId));
  };

  const handleCompletePurchase = () => {
    if (purchaseItems.length === 0) {
      toast({
        title: 'Adicione itens à compra',
        variant: 'destructive',
      });
      return;
    }

    if (!supplier.trim()) {
      toast({
        title: 'Informe o fornecedor',
        variant: 'destructive',
      });
      return;
    }

    const total = purchaseItems.reduce((acc, item) => acc + item.total, 0);

    createPurchase({
      items: purchaseItems,
      total,
      supplier,
      userId: user?.id || '',
      userName: user?.name || '',
    });

    toast({ title: 'Compra registrada com sucesso!' });
    setPurchaseItems([]);
    setSupplier('');
    setIsDialogOpen(false);
    loadData();
  };

  const purchaseTotal = purchaseItems.reduce((acc, item) => acc + item.total, 0);

  return (
    <AppLayout requiredRoles={['admin']}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Compras</h1>
            <p className="text-muted-foreground mt-1">
              Registre entrada de mercadorias
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Compra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Compra</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <Input
                    placeholder="Nome do fornecedor"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>Produto</Label>
                    <Select value={selectedProduct} onValueChange={handleProductSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-2">
                    <Label>Qtd</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Custo Unit.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="R$"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddItem} disabled={!selectedProduct || !unitCost}>
                      Adicionar
                    </Button>
                  </div>
                </div>
                {purchaseItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-center">Qtd</TableHead>
                          <TableHead className="text-right">Custo Unit.</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseItems.map((item) => (
                          <TableRow key={item.productId}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unitCost)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.total)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.productId)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-lg">
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-bold text-xl">{formatCurrency(purchaseTotal)}</span>
                  </div>
                  <Button
                    onClick={handleCompletePurchase}
                    disabled={purchaseItems.length === 0 || !supplier.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Registrar Compra
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Histórico de Compras</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma compra registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        {new Date(purchase.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>{purchase.supplier}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {purchase.items.map((item, idx) => (
                            <div key={idx} className="text-sm">
                              {item.quantity}x {item.productName}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{purchase.userName}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(purchase.total)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

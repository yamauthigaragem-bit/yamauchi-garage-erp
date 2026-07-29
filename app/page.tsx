'use client';

import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Bell, Camera, Car, CheckCircle, ClipboardList, CreditCard, FileText,
  ImageIcon, LogOut, MessageCircle, Package, Plus, Printer, Send, Settings,
  ShieldCheck, ShoppingCart, Store, Trash2, User, Wrench
} from 'lucide-react';

type Role = 'customer' | 'admin';
type UserAccount = { id: string; name: string; email: string; password: string; phone: string; role: Role };
type Product = { id: string; name: string; category: string; price: number; image: string; stock: number };
type ServiceRequest = { id: string; customerId: string; customerName: string; phone: string; vehicle: string; service: string; description: string; photos: string[]; status: string; createdAt: string };
type Order = { id: string; customerId: string; customerName: string; phone: string; items: { productId: string; name: string; price: number; quantity: number }[]; payment: string; status: string; createdAt: string };
type Notice = { id: string; userId: string; text: string; read: boolean; createdAt: string };
type CartItem = { product: Product; quantity: number };

const KEY = 'yamauchi_v2_';
const OWNER_EMAIL = 'yamauthigaragem@gmail.com';
const shopInfo = { name: 'Yamauchi Garage Auto Center', phone: '080-6962-8374', whatsapp: '818069628374', address: '381 Nakashinden, Fukuroi, Shizuoka 437-1111' };
const services = ['Funilaria e pintura', 'Mecânica', 'Elétrica', 'Shaken', 'Troca de óleo', 'Polimento e limpeza'];
const initialProducts: Product[] = [
  { id: 'p-1', name: 'Óleo de motor 5W-30', category: 'Manutenção', price: 4200, image: '/placeholder.svg', stock: 20 },
  { id: 'p-2', name: 'Limpador interno premium', category: 'Limpeza', price: 1800, image: '/placeholder.svg', stock: 15 },
  { id: 'p-3', name: 'Kit de palhetas', category: 'Acessórios', price: 3600, image: '/placeholder.svg', stock: 8 },
  { id: 'p-4', name: 'Capa de volante', category: 'Acessórios', price: 2900, image: '/placeholder.svg', stock: 12 },
];
const payments = ['Cartão de crédito', 'PayPay', 'Transferência bancária', 'Dinheiro na retirada'];

function read<T>(name: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(window.localStorage.getItem(KEY + name) || '') as T; } catch { return fallback; }
}
function yen(value: number) { return `¥${Math.round(value).toLocaleString('ja-JP')}`; }
function code(prefix: string) { return `${prefix}-${Date.now().toString().slice(-6)}`; }
function whatsapp(phone: string, text: string) { window.open(`https://wa.me/${phone.replace(/\D/g, '').replace(/^0/, '81')}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer'); }

export default function App() {
  const [users, setUsers] = useState<UserAccount[]>(() => read('users', []));
  const [products, setProducts] = useState<Product[]>(() => read('products', initialProducts));
  const [requests, setRequests] = useState<ServiceRequest[]>(() => read('requests', []));
  const [orders, setOrders] = useState<Order[]>(() => read('orders', []));
  const [notices, setNotices] = useState<Notice[]>(() => read('notices', []));
  const [adminPhones, setAdminPhones] = useState<string[]>(() => read('adminPhones', [shopInfo.phone]));
  const [current, setCurrent] = useState<UserAccount | null>(() => read('session', null));
  const [view, setView] = useState<'home' | 'shop' | 'service' | 'portal' | 'admin' | 'invoice'>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loginMode, setLoginMode] = useState<'login' | 'register'>('login');
  const [showAccess, setShowAccess] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [message, setMessage] = useState('');
  const [invoice, setInvoice] = useState<Order | ServiceRequest | null>(null);

  useEffect(() => { localStorage.setItem(KEY + 'users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(KEY + 'products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(KEY + 'requests', JSON.stringify(requests)); }, [requests]);
  useEffect(() => { localStorage.setItem(KEY + 'orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem(KEY + 'notices', JSON.stringify(notices)); }, [notices]);
  useEffect(() => { localStorage.setItem(KEY + 'adminPhones', JSON.stringify(adminPhones)); }, [adminPhones]);
  useEffect(() => { localStorage.setItem(KEY + 'session', JSON.stringify(current)); }, [current]);

  const customerNotices = notices.filter(n => n.userId === current?.id && !n.read);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const myRequests = requests.filter(item => item.customerId === current?.id);
  const myOrders = orders.filter(item => item.customerId === current?.id);
  const tell = (text: string) => { setMessage(text); window.setTimeout(() => setMessage(''), 3500); };
  const notify = (userId: string, text: string) => setNotices(previous => [{ id: code('N'), userId, text, read: false, createdAt: new Date().toLocaleString('pt-BR') }, ...previous]);
  const requireCustomer = (next: 'shop' | 'service' | 'portal') => { if (!current) { setShowAccess(true); return; } setView(next); };

  useEffect(() => {
    let active = true;

    async function restoreAdminSession() {
      try {
        const response = await fetch('/api/admin/session', { cache: 'no-store' });
        const data = await response.json();
        if (active && data.authenticated) {
          setCurrent({ id: 'admin-owner', name: 'Administrador Yamauchi Garage', email: OWNER_EMAIL, password: '', phone: shopInfo.phone, role: 'admin' });
          setView('admin');
          return true;
        }
      } catch {
        // Continua para a autenticação Supabase quando disponível.
      }
      return false;
    }

    async function restoreSession() {
      if (await restoreAdminSession()) return;
      if (!supabase) return;
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || !active) return;
      const { data: profile, error: profileError } = await supabase.from('profiles').select('full_name, phone, role').eq('id', auth.user.id).maybeSingle();
      if (!active) return;
      if (profileError || !profile) {
        await supabase.auth.signOut();
        setCurrent(null);
        tell('Seu perfil ainda não foi ativado. Execute o arquivo SQL de instalação no Supabase.');
        return;
      }
      const role: Role = profile.role === 'admin' ? 'admin' : 'customer';
      const user: UserAccount = { id: auth.user.id, name: profile.full_name || auth.user.email || 'Cliente', email: auth.user.email || '', password: '', phone: profile.phone || '', role };
      setCurrent(user); setView(role === 'admin' ? 'admin' : 'portal');
    }

    const listener = supabase?.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setShowPasswordReset(true);
    });

    void restoreSession();
    return () => {
      active = false;
      listener?.data.subscription.unsubscribe();
    };
  }, []);

  async function submitAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email')).trim().toLowerCase();
    const password = String(data.get('password'));

    if (loginMode === 'login' && email === OWNER_EMAIL) {
      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const result = await response.json();
        if (response.ok && result.authenticated) {
          const admin: UserAccount = { id: 'admin-owner', name: 'Administrador Yamauchi Garage', email, password: '', phone: shopInfo.phone, role: 'admin' };
          setCurrent(admin); setShowAccess(false); setView('admin'); tell('Bem-vindo ao painel administrativo!'); return;
        }
        if (!supabase) return tell(result.message || 'E-mail ou senha administrativa incorretos.');
      } catch {
        if (!supabase) return tell('Não foi possível acessar o servidor de autenticação.');
      }
    }

    if (supabase) {
      if (loginMode === 'login') {
        const { data: auth, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !auth.user) return tell(error?.message || 'Não foi possível entrar.');
        const { data: profile, error: profileError } = await supabase.from('profiles').select('full_name, phone, role').eq('id', auth.user.id).maybeSingle();
        if (profileError || !profile) {
          await supabase.auth.signOut();
          return tell('Perfil não ativado. Execute o SQL de instalação do Supabase e tente novamente.');
        }
        const role: Role = profile.role === 'admin' ? 'admin' : 'customer';
        const user: UserAccount = { id: auth.user.id, name: profile.full_name || auth.user.email || 'Cliente', email, password: '', phone: profile.phone || '', role };
        setCurrent(user); setShowAccess(false); setView(role === 'admin' ? 'admin' : 'portal'); tell(`Bem-vindo, ${user.name}!`); return;
      }
      const name = String(data.get('name')).trim(); const phone = String(data.get('phone')).trim();
      if (!name || !phone || !email || password.length < 6) return tell('Preencha os dados e use uma senha de pelo menos 6 caracteres.');
      const { data: auth, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, phone } } });
      if (error) return tell(error.message);
      if (!auth.user) return tell('Confira seu e-mail para confirmar o cadastro.');
      tell(email === OWNER_EMAIL ? 'Conta do proprietário criada. Confirme o e-mail para liberar o painel Admin.' : 'Cadastro criado. Confirme seu e-mail.');
      setShowAccess(false); return;
    }

    return tell('O banco Supabase ainda não está conectado.');
  }

  async function recoverPassword(email: string) {
    if (!supabase) return tell('O banco Supabase ainda não está conectado.');
    if (!email) return tell('Digite seu e-mail primeiro.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    if (error) return tell(error.message);
    tell('Enviamos um link para redefinir sua senha.');
  }

  async function updatePassword(newPassword: string) {
    if (!supabase) return tell('O banco Supabase ainda não está conectado.');
    if (newPassword.length < 8) return tell('Use uma senha com pelo menos 8 caracteres.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return tell(error.message);
    setShowPasswordReset(false);
    tell('Senha atualizada. Você já pode entrar normalmente.');
  }

  function addCart(product: Product) {
    setCart(previous => { const item = previous.find(entry => entry.product.id === product.id); return item ? previous.map(entry => entry.product.id === product.id ? { ...entry, quantity: entry.quantity + 1 } : entry) : [...previous, { product, quantity: 1 }]; });
    tell(`${product.name} adicionado ao carrinho.`);
  }
  function createOrder(payment: string) {
    if (!current || !cart.length) return;
    const order: Order = { id: code('PED'), customerId: current.id, customerName: current.name, phone: current.phone, items: cart.map(item => ({ productId: item.product.id, name: item.product.name, price: item.product.price, quantity: item.quantity })), payment, status: 'Aguardando confirmação', createdAt: new Date().toLocaleString('pt-BR') };
    setOrders(previous => [order, ...previous]); setCart([]); notify(current.id, `Pedido ${order.id} recebido. Aguarde a confirmação da loja.`);
    tell(`Pedido ${order.id} criado.`); whatsapp(adminPhones[0] || shopInfo.phone, `Novo pedido ${order.id}\nCliente: ${current.name}\nTotal: ${yen(order.items.reduce((s, i) => s + i.price * i.quantity, 0))}`);
  }
  function submitService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!current) return;
    const data = new FormData(event.currentTarget);
    const request: ServiceRequest = { id: code('ORC'), customerId: current.id, customerName: current.name, phone: current.phone, vehicle: String(data.get('vehicle')), service: String(data.get('service')), description: String(data.get('description')), photos: String(data.get('photos') || '').split('|').filter(Boolean), status: 'Pré-avaliação recebida', createdAt: new Date().toLocaleString('pt-BR') };
    setRequests(previous => [request, ...previous]); notify(current.id, `Recebemos sua solicitação ${request.id}. Nossa equipe fará a pré-avaliação.`); tell(`Orçamento ${request.id} enviado.`);
    whatsapp(adminPhones[0] || shopInfo.phone, `Novo orçamento ${request.id}\nCliente: ${current.name}\nVeículo: ${request.vehicle}\nServiço: ${request.service}\nFotos: ${request.photos.length}`);
    event.currentTarget.reset();
  }
  function updateStatus(item: ServiceRequest | Order, status: string, kind: 'request' | 'order') {
    if (kind === 'request') setRequests(previous => previous.map(row => row.id === item.id ? { ...row, status } : row)); else setOrders(previous => previous.map(row => row.id === item.id ? { ...row, status } : row));
    notify(item.customerId, `${item.id}: status atualizado para “${status}”.`); tell('Cliente notificado no aplicativo.');
  }

  return <div className="min-h-screen bg-slate-50 text-slate-800">
    <header className="sticky top-0 z-30 bg-slate-950 text-white shadow-lg">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <button onClick={() => setView('home')} className="flex items-center gap-3 text-left"><img src="/yamauchi-logo.png" alt="Yamauchi Garage" className="h-12 w-12 rounded-xl object-cover ring-1 ring-amber-400/50" /><span><span className="block text-lg font-black tracking-wide text-amber-400">山内ガレージ 板金</span><span className="text-[10px] font-bold tracking-[0.35em]">YAMAUCHI GARAGE AUTO CENTER</span></span></button>
        <nav className="flex flex-wrap items-center gap-1 text-xs font-bold">
          <button onClick={() => setView('home')} className="rounded-lg px-3 py-2 hover:bg-white/10">Início</button><button onClick={() => requireCustomer('service')} className="rounded-lg px-3 py-2 hover:bg-white/10">Serviços</button><button onClick={() => setView('shop')} className="rounded-lg px-3 py-2 hover:bg-white/10">Loja</button>
          {current?.role === 'admin' && <button onClick={() => setView('admin')} className="rounded-lg bg-amber-400 px-3 py-2 text-slate-950"><Settings className="mr-1 inline h-3.5 w-3.5" />Admin</button>}
          {current ? <><button onClick={() => setView('portal')} className="rounded-lg px-3 py-2 hover:bg-white/10"><Bell className="mr-1 inline h-3.5 w-3.5" />{customerNotices.length || ''}</button><button onClick={() => { void fetch('/api/admin/logout', { method: 'POST' }); void supabase?.auth.signOut(); setCurrent(null); setView('home'); }} className="rounded-lg px-3 py-2 hover:bg-white/10"><LogOut className="inline h-3.5 w-3.5" /></button></> : <button onClick={() => setShowAccess(true)} className="rounded-lg bg-blue-600 px-3 py-2"><User className="mr-1 inline h-3.5 w-3.5" />Entrar / Cadastro</button>}
        </nav>
      </div>
    </header>
    {message && <div className="fixed right-4 top-20 z-50 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-xl"><CheckCircle className="mr-2 inline h-4 w-4" />{message}</div>}

    {showAccess && <AccessModal mode={loginMode} setMode={setLoginMode} close={() => setShowAccess(false)} submit={submitAccess} recover={recoverPassword} />}
    {showPasswordReset && <PasswordResetModal close={() => setShowPasswordReset(false)} update={updatePassword} />}
    <main className="mx-auto max-w-7xl px-4 py-8">
      {view === 'home' && <Home onService={() => requireCustomer('service')} onShop={() => setView('shop')} />}
      {view === 'shop' && <Shop products={products} cart={cart} total={cartTotal} add={addCart} remove={(id) => setCart(c => c.filter(x => x.product.id !== id))} checkout={createOrder} logged={!!current} login={() => setShowAccess(true)} />}
      {view === 'service' && current && <ServiceForm onSubmit={submitService} />}
      {view === 'portal' && current && <CustomerPortal user={current} requests={myRequests} orders={myOrders} notices={notices.filter(n => n.userId === current.id)} read={() => setNotices(all => all.map(n => n.userId === current.id ? { ...n, read: true } : n))} openInvoice={(row) => { setInvoice(row); setView('invoice'); }} />}
      {view === 'admin' && current?.role === 'admin' && <AdminPanel users={users.filter(user => user.role === 'customer')} requests={requests} orders={orders} products={products} setProducts={setProducts} adminPhones={adminPhones} setAdminPhones={setAdminPhones} update={updateStatus} reply={(phone, text) => whatsapp(phone, text)} />}
      {view === 'invoice' && invoice && <Invoice document={invoice} back={() => setView(current?.role === 'admin' ? 'admin' : 'portal')} />}
    </main>
  </div>;
}

function Home({ onService, onShop }: { onService: () => void; onShop: () => void }) { return <div className="space-y-8"><section className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-7 py-14 text-white md:px-14"><p className="mb-3 text-sm font-black uppercase tracking-[.2em] text-amber-400">Auto center no Japão</p><h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">Serviços, peças e acompanhamento em um só lugar.</h1><p className="mt-5 max-w-2xl text-slate-300">Cada cliente tem seu próprio acesso para solicitar serviços, enviar fotos dos danos, acompanhar orçamentos e comprar produtos automotivos.</p><div className="mt-8 flex flex-wrap gap-3"><button onClick={onService} className="rounded-xl bg-amber-400 px-6 py-3 text-sm font-black text-slate-950">SOLICITAR PRÉ-AVALIAÇÃO</button><button onClick={onShop} className="rounded-xl border border-white/40 px-6 py-3 text-sm font-black">ENTRAR NA LOJA</button></div></section><div className="grid gap-4 md:grid-cols-3"><Feature icon={<Camera />} title="Fotos dos danos" text="Envie imagens do veículo para uma pré-avaliação visual." /><Feature icon={<ShieldCheck />} title="Área do cliente" text="Histórico particular de serviços, orçamentos e pedidos." /><Feature icon={<Store />} title="Loja automotiva" text="Peças, acessórios, limpeza e manutenção com pedido online." /></div></div>; }
function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) { return <div className="rounded-2xl border bg-white p-6"><div className="mb-4 text-blue-800">{icon}</div><h2 className="font-black">{title}</h2><p className="mt-2 text-sm text-slate-500">{text}</p></div>; }

function AccessModal({ mode, setMode, close, submit, recover }: { mode: 'login' | 'register'; setMode: (m: 'login' | 'register') => void; close: () => void; submit: (e: FormEvent<HTMLFormElement>) => void; recover: (email: string) => void }) { const [email, setEmail] = useState(''); return <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 p-4"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-3xl bg-white p-7 shadow-2xl"><div className="flex justify-between"><h2 className="text-xl font-black">{mode === 'login' ? 'Entrar — cliente ou administrador' : 'Criar conta de cliente'}</h2><button type="button" onClick={close}>✕</button></div>{mode === 'register' && <><input name="name" placeholder="Nome completo" className="input" required /><input name="phone" placeholder="Telefone / WhatsApp" className="input" required /></>}<input name="email" type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="input" required /><input name="password" type="password" placeholder="Senha" className="input" required /><button className="w-full rounded-xl bg-blue-900 py-3 text-sm font-black text-white">{mode === 'login' ? (email.toLowerCase() === OWNER_EMAIL ? 'ENTRAR COMO ADMINISTRADOR' : 'ENTRAR') : email.toLowerCase() === OWNER_EMAIL ? 'CRIAR ACESSO ADMIN' : 'CRIAR MEU ID'}</button>{mode === 'login' && <button type="button" onClick={() => recover(email)} className="w-full text-sm font-bold text-amber-700">Esqueci minha senha</button>}<button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full text-sm font-bold text-blue-800">{mode === 'login' ? 'Ainda não tenho cadastro' : 'Já tenho cadastro'}</button></form></div>; }

function PasswordResetModal({ close, update }: { close: () => void; update: (password: string) => void }) { const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4"><form onSubmit={(event) => { event.preventDefault(); if (password !== confirm) return; void update(password); }} className="w-full max-w-md space-y-4 rounded-3xl bg-white p-7 shadow-2xl"><div className="flex justify-between"><div><p className="text-xs font-black text-amber-600">ACESSO SEGURO</p><h2 className="text-xl font-black">Criar nova senha</h2></div><button type="button" onClick={close}>✕</button></div><p className="text-sm text-slate-500">Digite uma nova senha com pelo menos 8 caracteres.</p><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nova senha" className="input" minLength={8} required /><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirmar nova senha" className="input" minLength={8} required />{confirm && password !== confirm && <p className="text-sm font-bold text-red-600">As senhas não são iguais.</p>}<button disabled={!password || password !== confirm} className="w-full rounded-xl bg-blue-900 py-3 text-sm font-black text-white disabled:opacity-40">SALVAR NOVA SENHA</button></form></div>; }

function ServiceForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { const [photos, setPhotos] = useState<string[]>([]); const upload = (event: ChangeEvent<HTMLInputElement>) => { const files = Array.from(event.target.files || []); files.forEach(file => { const reader = new FileReader(); reader.onload = () => setPhotos(previous => [...previous, String(reader.result)]); reader.readAsDataURL(file); }); }; return <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-5 rounded-3xl border bg-white p-6 shadow-sm"><input type="hidden" name="photos" value={photos.join('|')} /><div><p className="text-sm font-black text-amber-600">PRÉ-AVALIAÇÃO VISUAL</p><h1 className="text-3xl font-black">Solicite seu orçamento</h1><p className="mt-2 text-sm text-slate-500">Envie fotos claras dos danos. A resposta chegará na área do cliente e poderá ser enviada pelo WhatsApp.</p></div><input name="vehicle" required placeholder="Veículo: marca, modelo e ano" className="input" /><select name="service" className="input">{services.map(item => <option key={item}>{item}</option>)}</select><textarea name="description" required placeholder="Descreva o serviço ou os danos" className="input min-h-28" /><label className="block cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center text-sm font-bold text-slate-500"><Camera className="mx-auto mb-2 h-6 w-6" />Adicionar fotos do veículo<input type="file" accept="image/*" multiple className="hidden" onChange={upload} /></label>{photos.length > 0 && <div className="flex flex-wrap gap-3">{photos.map((photo, index) => <img key={index} src={photo} alt="Dano do veículo" className="h-24 w-32 rounded-lg object-cover" />)}</div>}<button className="w-full rounded-xl bg-blue-900 py-4 font-black text-white">ENVIAR PARA PRÉ-AVALIAÇÃO</button></form>; }

function Shop({ products, cart, total, add, remove, checkout, logged, login }: { products: Product[]; cart: CartItem[]; total: number; add: (p: Product) => void; remove: (id: string) => void; checkout: (payment: string) => void; logged: boolean; login: () => void }) { const [payment, setPayment] = useState(payments[0]); return <div className="grid gap-7 lg:grid-cols-[1fr_330px]"><div><p className="text-sm font-black text-amber-600">LOJA VIRTUAL</p><h1 className="mb-5 text-3xl font-black">Peças, acessórios e cuidados</h1><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map(product => <article key={product.id} className="overflow-hidden rounded-2xl border bg-white"><img src={product.image} alt={product.name} className="h-40 w-full bg-slate-100 object-contain p-4" /><div className="p-4"><p className="text-xs font-bold text-blue-700">{product.category}</p><h2 className="mt-1 font-black">{product.name}</h2><p className="mt-3 text-xl font-black text-slate-900">{yen(product.price)}</p><button onClick={() => add(product)} className="mt-3 w-full rounded-lg bg-slate-900 py-2 text-xs font-black text-white"><ShoppingCart className="mr-1 inline h-3.5 w-3.5" />ADICIONAR</button></div></article>)}</div></div><aside className="h-fit rounded-2xl border bg-white p-5"><h2 className="font-black"><ShoppingCart className="mr-2 inline h-5 w-5" />Carrinho</h2>{cart.length === 0 ? <p className="py-6 text-sm text-slate-500">Seu carrinho está vazio.</p> : <div className="space-y-3 py-4">{cart.map(item => <div key={item.product.id} className="flex justify-between gap-2 text-sm"><span>{item.quantity}× {item.product.name}</span><button onClick={() => remove(item.product.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button></div>)}</div>}<div className="border-t pt-4"><p className="text-xl font-black">Total: {yen(total)}</p><select value={payment} onChange={e => setPayment(e.target.value)} className="input mt-4">{payments.map(item => <option key={item}>{item}</option>)}</select>{logged ? <button disabled={!cart.length} onClick={() => checkout(payment)} className="mt-3 w-full rounded-xl bg-emerald-600 py-3 text-sm font-black text-white disabled:opacity-40">FINALIZAR PEDIDO</button> : <button onClick={login} className="mt-3 w-full rounded-xl bg-blue-900 py-3 text-sm font-black text-white">ENTRAR PARA COMPRAR</button>}<p className="mt-3 text-[11px] text-slate-400">O pagamento será confirmado pela equipe antes da cobrança.</p></div></aside></div>; }

function CustomerPortal({ user, requests, orders, notices, read, openInvoice }: { user: UserAccount; requests: ServiceRequest[]; orders: Order[]; notices: Notice[]; read: () => void; openInvoice: (d: Order | ServiceRequest) => void }) { return <div className="space-y-7"><section className="rounded-3xl bg-slate-900 p-7 text-white"><p className="text-sm font-bold text-amber-400">ÁREA DO CLIENTE</p><h1 className="text-3xl font-black">Olá, {user.name}</h1><p className="mt-2 text-slate-300">Seu ID de cliente: <strong>{user.id}</strong></p></section><section className="rounded-2xl border bg-white p-5"><div className="flex justify-between"><h2 className="font-black"><Bell className="mr-2 inline h-5 w-5 text-amber-500" />Notificações</h2><button onClick={read} className="text-xs font-bold text-blue-800">Marcar como lidas</button></div>{notices.length ? notices.map(notice => <p key={notice.id} className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">{notice.text}<span className="ml-2 text-xs text-slate-400">{notice.createdAt}</span></p>) : <p className="mt-3 text-sm text-slate-500">Nenhuma notificação ainda.</p>}</section><History title="Meus serviços e orçamentos" icon={<Wrench />} rows={requests} open={openInvoice} /><History title="Minhas compras" icon={<Package />} rows={orders} open={openInvoice} /></div>; }
function History({ title, icon, rows, open }: { title: string; icon: ReactNode; rows: (Order | ServiceRequest)[]; open: (d: Order | ServiceRequest) => void }) { return <section className="rounded-2xl border bg-white p-5"><h2 className="font-black">{icon} <span className="ml-2">{title}</span></h2>{rows.length === 0 ? <p className="py-5 text-sm text-slate-500">Nenhum registro no momento.</p> : <div className="mt-4 space-y-2">{rows.map(row => <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-4 text-sm"><div><strong>{row.id}</strong><p className="text-slate-500">{row.createdAt}</p></div><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">{row.status}</span><button onClick={() => open(row)} className="text-xs font-black text-blue-800"><FileText className="mr-1 inline h-4 w-4" />Documento</button></div>)}</div>}</section>; }

function AdminPanel({ users, requests, orders, products, setProducts, adminPhones, setAdminPhones, update, reply }: { users: UserAccount[]; requests: ServiceRequest[]; orders: Order[]; products: Product[]; setProducts: (p: Product[]) => void; adminPhones: string[]; setAdminPhones: (p: string[]) => void; update: (item: ServiceRequest | Order, status: string, kind: 'request' | 'order') => void; reply: (phone: string, text: string) => void }) { const [newPhone, setNewPhone] = useState(''); const [newProduct, setNewProduct] = useState({ name: '', category: 'Acessórios', price: '', image: '' }); const addProduct = () => { if (!newProduct.name || !Number(newProduct.price)) return; setProducts([{ id: code('PROD'), name: newProduct.name, category: newProduct.category, price: Number(newProduct.price), image: newProduct.image || '/placeholder.svg', stock: 1 }, ...products]); setNewProduct({ name: '', category: 'Acessórios', price: '', image: '' }); }; const uploadProductImage = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setNewProduct(product => ({ ...product, image: String(reader.result) })); reader.readAsDataURL(file); }; return <div className="space-y-7"><section><p className="text-sm font-black text-amber-600">PAINEL ADMINISTRATIVO</p><h1 className="text-3xl font-black">Clientes, serviços e vendas</h1></section><div className="grid gap-4 md:grid-cols-3"><AdminCard label="Clientes cadastrados" value={users.length} /><AdminCard label="Orçamentos recebidos" value={requests.length} /><AdminCard label="Pedidos da loja" value={orders.length} /></div><AdminList title="Solicitações de serviço" rows={requests} kind="request" update={update} reply={reply} /><AdminList title="Pedidos e vendas" rows={orders} kind="order" update={update} reply={reply} /><section className="grid gap-6 lg:grid-cols-2"><div className="rounded-2xl border bg-white p-5"><h2 className="font-black"><Plus className="mr-1 inline h-5 w-5" />Adicionar produto</h2><div className="mt-4 space-y-3"><input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Nome da peça ou acessório" className="input" /><input value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} placeholder="Categoria" className="input" /><input value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} type="number" placeholder="Preço em ienes" className="input" /><label className="block cursor-pointer rounded-xl border-2 border-dashed p-3 text-center text-xs font-bold text-slate-500"><ImageIcon className="mr-1 inline h-4 w-4" />Adicionar foto do produto<input type="file" accept="image/*" className="hidden" onChange={uploadProductImage} /></label>{newProduct.image && <img src={newProduct.image} alt="Prévia do produto" className="h-28 w-full rounded-xl object-contain" />}<button onClick={addProduct} className="w-full rounded-xl bg-blue-900 py-3 text-sm font-black text-white">PUBLICAR PRODUTO</button></div></div><div className="rounded-2xl border bg-white p-5"><h2 className="font-black"><MessageCircle className="mr-1 inline h-5 w-5" />Telefones dos administradores</h2><p className="mt-2 text-sm text-slate-500">Os novos pedidos abrem o WhatsApp no primeiro número. Cadastre outros responsáveis para a equipe.</p><div className="mt-4 space-y-2">{adminPhones.map(phone => <div key={phone} className="flex justify-between rounded-lg bg-slate-50 p-3 text-sm font-bold"><span>{phone}</span><button onClick={() => setAdminPhones(adminPhones.filter(value => value !== phone))} className="text-red-600">Remover</button></div>)}</div><div className="mt-3 flex gap-2"><input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Novo WhatsApp" className="input" /><button onClick={() => { if (newPhone) { setAdminPhones([...adminPhones, newPhone]); setNewPhone(''); } }} className="rounded-xl bg-slate-900 px-4 text-xs font-black text-white">ADICIONAR</button></div></div></section></div>; }
function AdminCard({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-blue-900">{value}</p></div>; }
function AdminList({ title, rows, kind, update, reply }: { title: string; rows: (Order | ServiceRequest)[]; kind: 'request' | 'order'; update: (i: ServiceRequest | Order, status: string, kind: 'request' | 'order') => void; reply: (p: string, t: string) => void }) { return <section className="rounded-2xl border bg-white p-5"><h2 className="font-black"><ClipboardList className="mr-2 inline h-5 w-5" />{title}</h2>{rows.length === 0 ? <p className="py-5 text-sm text-slate-500">Nenhum item recebido.</p> : <div className="mt-4 space-y-3">{rows.map(row => <div key={row.id} className="rounded-xl border p-4"><div className="flex flex-wrap justify-between gap-3"><div><strong>{row.id} — {row.customerName}</strong><p className="text-sm text-slate-500">{row.createdAt} · {row.phone}</p>{kind === 'request' && <p className="mt-1 text-sm">{(row as ServiceRequest).vehicle} — {(row as ServiceRequest).service} ({(row as ServiceRequest).photos.length} foto(s))</p>}</div><span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{row.status}</span></div>{kind === 'request' && (row as ServiceRequest).photos.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{(row as ServiceRequest).photos.map((photo, index) => <img key={index} src={photo} alt="Dano enviado pelo cliente" className="h-20 w-28 rounded-lg object-cover" />)}</div>}<div className="mt-3 flex flex-wrap gap-2"><button onClick={() => update(row, 'Em análise', kind)} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800">Em análise</button><button onClick={() => update(row, 'Concluído / pronto para retirada', kind)} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">Concluído</button><button onClick={() => reply(row.phone, `Olá, ${row.customerName}. Sobre ${row.id}: `)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><Send className="mr-1 inline h-3.5 w-3.5" />Responder</button></div></div>)}</div>}</section>; }

function Invoice({ document, back }: { document: Order | ServiceRequest; back: () => void }) { const isOrder = 'items' in document; const items = isOrder ? document.items : [{ name: `${document.service} — ${document.vehicle}`, price: 0, quantity: 1 }]; const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0); const tax = Math.round(subtotal * .1); return <div><div className="mb-5 flex gap-3 print:hidden"><button onClick={back} className="rounded-xl border px-4 py-2 text-sm font-bold">Voltar</button><button onClick={() => window.print()} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white"><Printer className="mr-1 inline h-4 w-4" />Imprimir / Salvar PDF</button></div><article id="invoice" className="mx-auto max-w-5xl overflow-hidden border border-slate-300 bg-white shadow-sm"><header className="grid md:grid-cols-[1.2fr_2fr_1fr]"><div className="bg-gradient-to-br from-slate-950 to-blue-950 p-7 text-amber-400"><p className="text-2xl font-black">山内ガレージ 板金</p><p className="mt-2 text-sm font-bold tracking-[.25em] text-white">AUTO CENTER</p></div><div className="p-7 text-center"><h1 className="text-4xl font-black text-slate-900">請 求 書</h1><p className="mt-2 text-lg font-black">SEIKYUSHO (INVOICE)</p></div><div className="p-7 text-sm"><p><b>Nº DA FATURA</b><br />{document.id}</p><p className="mt-3"><b>DATA DE EMISSÃO</b><br />{document.createdAt}</p></div></header><div className="grid gap-5 p-7 md:grid-cols-2"><section className="rounded-lg border p-4"><p className="font-black">CLIENTE</p><p className="mt-3 text-xl font-black">{document.customerName}</p><p>{document.phone}</p></section><section className="rounded-lg border p-4"><p className="font-black">YAMAUCHI GARAGE AUTO CENTER</p><p className="mt-3">{shopInfo.address}</p><p>{shopInfo.phone}</p></section></div><div className="px-7 pb-7"><table className="w-full border-collapse text-sm"><thead className="bg-slate-950 text-white"><tr><th className="p-3 text-left">DESCRIÇÃO / PEÇAS E SERVIÇOS</th><th className="p-3">QTD.</th><th className="p-3 text-right">VALOR</th></tr></thead><tbody>{items.map((item, index) => <tr key={index} className="border"><td className="p-3">{item.name}</td><td className="p-3 text-center">{item.quantity}</td><td className="p-3 text-right">{yen(item.price * item.quantity)}</td></tr>)}</tbody></table><div className="ml-auto mt-5 max-w-sm rounded-lg bg-slate-950 p-5 text-white"><p className="flex justify-between"><span>SUBTOTAL</span><strong>{yen(subtotal)}</strong></p><p className="mt-2 flex justify-between"><span>IMPOSTO (10%)</span><strong>{yen(tax)}</strong></p><p className="mt-4 flex justify-between border-t border-slate-600 pt-4 text-2xl font-black text-amber-400"><span>TOTAL</span><span>{yen(subtotal + tax)}</span></p></div><p className="mt-6 text-sm text-slate-500">Pagamento: {isOrder ? document.payment : 'A definir após avaliação'} · Status: {document.status}</p></div></article></div>; }

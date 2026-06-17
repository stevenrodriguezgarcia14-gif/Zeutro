// =====================================================================
// Centro de Orientación de Zentro — perfiles de negocio, rutas (playbooks)
// y catálogo de módulos. Es la base de la experiencia personalizada.
// =====================================================================

export type ModuleSlug =
  | "customers" | "sales" | "quotations" | "products" | "purchases" | "inventory"
  | "invoices" | "collections" | "expenses" | "accounts" | "cashflow" | "profitability"
  | "tasks" | "projects" | "calendar" | "documents";

// Datos reales del negocio para calcular activación y siguiente paso.
export type ActivationData = {
  customers: number;
  products: number;
  productsWithPrice: number;
  purchases: number;
  purchaseItems: number;          // productos dentro de compras
  purchaseItemsWithPrice: number; // con precio de venta puesto
  resaleSales: number;            // artículos de compra con unidades vendidas
  quotations: number;
  invoices: number;
  payments: number;
  expenses: number;
  accounts: number;
  opportunities: number;
  projects: number;
  overdueInvoices: number;
  openQuotations: number;
};

export type Step = {
  key: string;
  label: string;
  href: string;
  cta: string;
  done: (d: ActivationData) => boolean;
};

// ---- Playbooks (rutas recomendadas) -------------------------------------
const PLAYBOOKS: Record<string, Step[]> = {
  resale: [
    { key: "compra", label: "Registra tu primera compra", href: "/purchases/new", cta: "Registrar compra", done: (d) => d.purchases > 0 },
    { key: "productos", label: "Agrega tus productos", href: "/purchases", cta: "Agregar productos", done: (d) => d.products > 0 || d.purchaseItems > 0 },
    { key: "precios", label: "Configura precios de venta", href: "/purchases", cta: "Poner precios", done: (d) => d.productsWithPrice > 0 || d.purchaseItemsWithPrice > 0 },
    { key: "venta", label: "Registra tu primera venta", href: "/purchases", cta: "Registrar venta", done: (d) => d.invoices > 0 || d.payments > 0 || d.resaleSales > 0 },
    { key: "rentabilidad", label: "Revisa tu rentabilidad", href: "/profitability", cta: "Ver rentabilidad", done: (d) => d.purchases > 0 && (d.payments > 0 || d.resaleSales > 0) },
  ],
  services: [
    { key: "cliente", label: "Crea tu primer cliente", href: "/customers/new", cta: "Crear cliente", done: (d) => d.customers > 0 },
    { key: "cotizacion", label: "Crea una cotización", href: "/quotations/new", cta: "Cotizar", done: (d) => d.quotations > 0 },
    { key: "proyecto", label: "Abre un proyecto", href: "/projects/new", cta: "Crear proyecto", done: (d) => d.projects > 0 },
    { key: "factura", label: "Emite una factura", href: "/invoices/new", cta: "Facturar", done: (d) => d.invoices > 0 },
    { key: "seguimiento", label: "Da seguimiento y cobra", href: "/collections", cta: "Ver cobranzas", done: (d) => d.payments > 0 },
  ],
  cash: [
    { key: "cuenta", label: "Crea tu caja o banco", href: "/accounts/new", cta: "Crear cuenta", done: (d) => d.accounts > 0 },
    { key: "gastos", label: "Registra tus gastos", href: "/expenses/new", cta: "Registrar gasto", done: (d) => d.expenses > 0 },
    { key: "compras", label: "Registra tus compras", href: "/purchases/new", cta: "Registrar compra", done: (d) => d.purchases > 0 },
    { key: "ventas", label: "Registra tus ventas", href: "/invoices/new", cta: "Registrar venta", done: (d) => d.invoices > 0 || d.payments > 0 },
    { key: "flujo", label: "Revisa tu flujo de caja", href: "/cashflow", cta: "Ver flujo", done: (d) => d.accounts > 0 && d.expenses > 0 },
  ],
  general: [
    { key: "cliente", label: "Crea tu primer cliente", href: "/customers/new", cta: "Crear cliente", done: (d) => d.customers > 0 },
    { key: "producto", label: "Agrega un producto o servicio", href: "/products/new", cta: "Agregar", done: (d) => d.products > 0 },
    { key: "factura", label: "Emite tu primera factura", href: "/invoices/new", cta: "Facturar", done: (d) => d.invoices > 0 },
    { key: "cobro", label: "Registra un cobro", href: "/collections", cta: "Cobrar", done: (d) => d.payments > 0 },
    { key: "rentabilidad", label: "Revisa tu rentabilidad", href: "/profitability", cta: "Ver rentabilidad", done: (d) => d.payments > 0 },
  ],
};

// ---- Perfiles de negocio -------------------------------------------------
export type Profile = {
  slug: string;
  label: string;
  emoji: string;
  desc: string;
  playbook: keyof typeof PLAYBOOKS;
  priority: ModuleSlug[];
  recommended: ModuleSlug[];
  optional: ModuleSlug[];
};

export const PROFILES: Profile[] = [
  { slug: "revendedor", label: "Revendedor", emoji: "🛍️", desc: "Compras mercancía para revenderla.", playbook: "resale",
    priority: ["purchases", "products", "sales", "profitability"], recommended: ["inventory", "customers", "invoices", "cashflow", "expenses"], optional: ["quotations", "projects", "tasks", "calendar"] },
  { slug: "tienda_fisica", label: "Tienda física", emoji: "🏪", desc: "Vendes al público en un local.", playbook: "resale",
    priority: ["products", "purchases", "sales", "inventory", "profitability"], recommended: ["expenses", "cashflow", "customers", "accounts"], optional: ["quotations", "projects", "tasks"] },
  { slug: "ecommerce", label: "Comercio electrónico", emoji: "🛒", desc: "Vendes productos en línea.", playbook: "resale",
    priority: ["products", "purchases", "inventory", "sales", "profitability"], recommended: ["customers", "invoices", "cashflow", "expenses"], optional: ["quotations", "projects"] },
  { slug: "fabricante", label: "Fabricante de productos", emoji: "🏭", desc: "Produces lo que vendes.", playbook: "resale",
    priority: ["products", "purchases", "inventory", "profitability"], recommended: ["customers", "invoices", "cashflow", "expenses"], optional: ["quotations", "projects", "tasks"] },
  { slug: "servicios", label: "Negocio de servicios", emoji: "🧰", desc: "Vendes tu trabajo o servicios.", playbook: "services",
    priority: ["customers", "quotations", "invoices", "collections"], recommended: ["products", "projects", "cashflow", "expenses"], optional: ["purchases", "inventory", "sales"] },
  { slug: "freelancer", label: "Freelancer", emoji: "💻", desc: "Trabajas por tu cuenta para clientes.", playbook: "services",
    priority: ["customers", "quotations", "projects", "invoices"], recommended: ["tasks", "collections", "cashflow"], optional: ["purchases", "inventory", "sales"] },
  { slug: "consultor", label: "Consultor", emoji: "🎯", desc: "Asesoras y cobras por proyecto u hora.", playbook: "services",
    priority: ["customers", "quotations", "projects", "invoices"], recommended: ["tasks", "calendar", "profitability", "collections"], optional: ["purchases", "inventory"] },
  { slug: "agencia", label: "Agencia", emoji: "🏢", desc: "Equipo que atiende varios clientes.", playbook: "services",
    priority: ["customers", "sales", "quotations", "projects", "invoices"], recommended: ["tasks", "collections", "profitability", "cashflow"], optional: ["purchases", "inventory"] },
  { slug: "profesional", label: "Profesional independiente", emoji: "👩‍⚕️", desc: "Médico, abogado, contador, etc.", playbook: "services",
    priority: ["customers", "invoices", "calendar", "collections"], recommended: ["quotations", "expenses", "cashflow"], optional: ["purchases", "inventory", "projects", "sales"] },
  { slug: "restaurante", label: "Restaurante / Comida", emoji: "🍽️", desc: "Preparas y vendes alimentos.", playbook: "cash",
    priority: ["expenses", "purchases", "cashflow", "profitability"], recommended: ["products", "sales", "accounts"], optional: ["quotations", "projects", "invoices", "tasks"] },
  { slug: "familiar", label: "Negocio familiar", emoji: "👨‍👩‍👧", desc: "Negocio pequeño llevado en familia.", playbook: "cash",
    priority: ["sales", "expenses", "cashflow", "profitability"], recommended: ["products", "customers", "accounts", "purchases"], optional: ["quotations", "projects", "tasks"] },
  { slug: "otro", label: "Otro / General", emoji: "✨", desc: "Algo distinto: te mostramos lo esencial.", playbook: "general",
    priority: ["customers", "invoices", "expenses", "cashflow"], recommended: ["products", "sales", "profitability"], optional: ["purchases", "inventory", "projects", "quotations"] },
];

export function getProfile(slug: string | null | undefined): Profile {
  return PROFILES.find((p) => p.slug === slug) ?? PROFILES[PROFILES.length - 1]; // "otro" por defecto
}

export function getPlaybook(profile: Profile): Step[] {
  return PLAYBOOKS[profile.playbook];
}

// ---- Catálogo de módulos (la "guía") ------------------------------------
export type ModuleInfo = {
  slug: ModuleSlug;
  name: string;
  href: string;
  emoji: string;
  queEs: string;
  cuando: string;
  cuandoNo: string;
  errores: string;
  relacion: string;
};

export const MODULES: Record<ModuleSlug, ModuleInfo> = {
  customers: { slug: "customers", name: "Clientes", href: "/customers", emoji: "👥",
    queEs: "El directorio de las personas y empresas a las que les vendes.",
    cuando: "Cuando empiezas a tratar con alguien que te compra o te podría comprar.",
    cuandoNo: "Para tus proveedores (esos van dentro de Compras o Gastos).",
    errores: "Crear un cliente duplicado en lugar de buscar el existente.",
    relacion: "Es la base de Cotizaciones, Facturas, Ventas y Cobranzas." },
  sales: { slug: "sales", name: "Ventas (Embudo)", href: "/sales", emoji: "📊",
    queEs: "Un tablero para seguir oportunidades de venta por etapas hasta cerrarlas.",
    cuando: "Cuando tienes prospectos que requieren seguimiento antes de comprar.",
    cuandoNo: "Si vendes de contado al instante (ahí solo registra la factura/venta).",
    errores: "Dejar oportunidades estancadas sin mover de etapa.",
    relacion: "Alimenta el Flujo de caja (ventas probables) y se convierte en Cotización o Factura." },
  quotations: { slug: "quotations", name: "Cotizaciones", href: "/quotations", emoji: "📝",
    queEs: "Presupuestos formales que envías al cliente antes de venderle.",
    cuando: "Cuando el cliente necesita ver precio y alcance antes de aceptar.",
    cuandoNo: "Si ya hay acuerdo cerrado: pasa directo a Factura.",
    errores: "No darles seguimiento; una cotización sin respuesta se enfría.",
    relacion: "Se convierte en Factura con un clic y descuenta Inventario al hacerlo." },
  products: { slug: "products", name: "Productos y servicios", href: "/products", emoji: "📦",
    queEs: "Tu catálogo de lo que vendes, con precio y costo.",
    cuando: "Antes de facturar, para no escribir lo mismo cada vez y medir rentabilidad.",
    cuandoNo: "Para insumos que compras y no revendes tal cual (esos van en Compras/Gastos).",
    errores: "Dejar el costo en cero: sin costo no se puede calcular tu ganancia real.",
    relacion: "Se usa en Facturas, Cotizaciones e Inventario; su costo alimenta Rentabilidad." },
  purchases: { slug: "purchases", name: "Compras (reventa)", href: "/purchases", emoji: "🛒",
    queEs: "Registro de la inversión que haces al comprar mercancía para revender.",
    cuando: "Cuando compras productos para venderlos después.",
    cuandoNo: "Cuando registras una venta (eso es Factura) o un gasto operativo (eso es Gastos).",
    errores: "Registrar ventas como compras, o confundir compras de reventa con gastos del negocio.",
    relacion: "Su ganancia entra a Rentabilidad y su inversión pendiente al Flujo de caja." },
  inventory: { slug: "inventory", name: "Inventario", href: "/inventory", emoji: "📊",
    queEs: "El control de cuántas unidades te quedan de cada producto.",
    cuando: "Si manejas existencias físicas y quieres saber cuándo reponer.",
    cuandoNo: "Si vendes servicios o productos sin stock que controlar.",
    errores: "No activar 'controlar inventario' en el producto y luego esperar que cuente.",
    relacion: "Baja solo al facturar y sube al registrar compras." },
  invoices: { slug: "invoices", name: "Facturas", href: "/invoices", emoji: "🧾",
    queEs: "El documento de cobro de una venta y el registro de cuánto te deben.",
    cuando: "Cada vez que vendes algo, de contado o a crédito.",
    cuandoNo: "Para una venta que aún no cierras (usa Cotización).",
    errores: "Dejar facturas en borrador y olvidarlas; un borrador no cobra ni descuenta stock.",
    relacion: "Genera Cobranzas, mueve Cuentas al pagarse y descuenta Inventario al emitirse." },
  collections: { slug: "collections", name: "Cobranzas", href: "/collections", emoji: "📬",
    queEs: "La bandeja priorizada de lo que te deben, con recordatorios.",
    cuando: "Cuando tienes facturas a crédito por cobrar.",
    cuandoNo: "Si todo lo vendes de contado y no queda saldo pendiente.",
    errores: "Esperar a que el cliente pague solo en vez de enviar recordatorios a tiempo.",
    relacion: "Se nutre de Facturas con saldo y registra el pago en Cuentas." },
  expenses: { slug: "expenses", name: "Gastos", href: "/expenses", emoji: "💸",
    queEs: "El registro de todo el dinero que sale para operar tu negocio.",
    cuando: "Renta, sueldos, servicios, insumos, comisiones... todo lo que pagas.",
    cuandoNo: "Para mercancía de reventa (eso va en Compras).",
    errores: "No registrar gastos pequeños: distorsionan tu ganancia real.",
    relacion: "Baja tu Rentabilidad, afecta el Flujo de caja y mueve Cuentas al pagarse." },
  accounts: { slug: "accounts", name: "Cuentas", href: "/accounts", emoji: "🏦",
    queEs: "Tus cajas y bancos, con su saldo y movimientos.",
    cuando: "Para saber cuánto dinero real tienes y de dónde entra/sale.",
    cuandoNo: "No necesitas una por cada cosa; empieza con caja y banco.",
    errores: "No registrar el saldo inicial, así nunca cuadra.",
    relacion: "Se mueve con Pagos, Gastos y transferencias; es la base del Flujo de caja." },
  cashflow: { slug: "cashflow", name: "Flujo de caja", href: "/cashflow", emoji: "💧",
    queEs: "La proyección de cuánto dinero tendrás sumando cobros y restando pagos.",
    cuando: "Para anticipar si te alcanzará el dinero las próximas semanas.",
    cuandoNo: "No requiere captura: se calcula solo con tus facturas, gastos y ventas.",
    errores: "Ignorar la alerta de saldo negativo proyectado.",
    relacion: "Combina Cuentas, Facturas por cobrar, Gastos por pagar y el Embudo." },
  profitability: { slug: "profitability", name: "Rentabilidad", href: "/profitability", emoji: "📈",
    queEs: "Cuánto ganas de verdad: ingresos menos costos y gastos.",
    cuando: "Para saber si tu negocio (y cada producto) deja dinero.",
    cuandoNo: "No requiere captura: se calcula con tus ventas, costos y compras.",
    errores: "Confiar en las ventas sin mirar el costo: vender mucho no es ganar.",
    relacion: "Usa Pagos, Gastos, costos de Productos y la ganancia de Compras." },
  tasks: { slug: "tasks", name: "Tareas", href: "/tasks", emoji: "✅",
    queEs: "Tu lista de pendientes, con prioridad, fecha y repetición.",
    cuando: "Para no olvidar lo que tienes que hacer hoy y esta semana.",
    cuandoNo: "Para trabajo grande con varias etapas (usa Proyectos).",
    errores: "Llenar de tareas sin fecha; sin fecha no entran a tus prioridades.",
    relacion: "Se conecta con Proyectos y aparece en el Centro de Prioridades." },
  projects: { slug: "projects", name: "Proyectos", href: "/projects", emoji: "📁",
    queEs: "Trabajos grandes con varias tareas, fechas y un cliente.",
    cuando: "Cuando un encargo lleva varios pasos o semanas.",
    cuandoNo: "Para un pendiente simple (usa una Tarea).",
    errores: "No ligar el proyecto a un cliente ni a sus tareas.",
    relacion: "Agrupa Tareas y se puede facturar al cliente relacionado." },
  calendar: { slug: "calendar", name: "Calendario", href: "/calendar", emoji: "📅",
    queEs: "La vista de agenda de tus tareas y vencimientos por fecha.",
    cuando: "Para ver de un vistazo qué cae cada día.",
    cuandoNo: "Si gestionas todo desde la lista de Tareas.",
    errores: "Poner fechas irreales que luego se vencen.",
    relacion: "Refleja Tareas y vencimientos de Facturas." },
  documents: { slug: "documents", name: "Documentos", href: "/documents", emoji: "📎",
    queEs: "Un lugar seguro para guardar archivos del negocio.",
    cuando: "Contratos, comprobantes, identificaciones, etc.",
    cuandoNo: "Para notas rápidas (usa la descripción del registro correspondiente).",
    errores: "Subir todo sin nombrarlo bien y luego no encontrarlo.",
    relacion: "Puedes asociarlos a clientes, facturas o proyectos." },
};

import {
  ArrowUpRight,
  Check,
  LayoutGrid,
  List,
  Package,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Badge, Can, Empty, Modal, Panel } from "../components/ui";
import type { Product } from "../data/models";
import { money, useStore } from "../lib/store";
const Product3D = lazy(() => import("../components/Product3D"));
function ProductForm({
  onClose,
  product,
}: {
  onClose: () => void;
  product?: Product;
}) {
  const { data, addProduct, update, toast } = useStore();
  const [image, setImage] = useState(product?.image || "");
  const [uploadError, setUploadError] = useState("");
  const upload = (file?: File) => {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setUploadError("Choose a JPG, PNG, or WebP image under 2 MB.");
      return;
    }
    setUploadError("");
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.onerror = () =>
      setUploadError("The image could not be read. Please choose it again.");
    reader.readAsDataURL(file);
  };
  return (
    <Modal
      title={product ? "Edit product" : "Add a product"}
      onClose={onClose}
      wide
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const get = (k: string) => String(f.get(k) || "");
          if (
            data.products.some(
              (p) =>
                p.sku.toLowerCase() === get("sku").toLowerCase() &&
                p.id !== product?.id,
            )
          ) {
            toast("This SKU already exists. Choose a unique SKU.");
            return;
          }
          const p: Product = {
            id: product?.id || crypto.randomUUID(),
            name: get("name"),
            description: get("description"),
            category: get("category"),
            price: Number(get("price")),
            compareAt: Number(get("compareAt")),
            stock: Number(get("stock")),
            sold: product?.sold || 0,
            views: product?.views || 0,
            conversion: product?.conversion || 0,
            status: get("status") as Product["status"],
            ingredients: get("ingredients"),
            packSize: get("packSize"),
            sku: get("sku"),
            wholesale: f.get("wholesale") === "on",
            flavor: get("name").toUpperCase(),
            tone: product?.tone || "#008DDA",
            image: image || undefined,
          };
          if (product) {
            update((d) => ({
              ...d,
              products: d.products.map((x) => (x.id === p.id ? p : x)),
            }));
            toast("Product updated");
          } else addProduct(p);
          onClose();
        }}
      >
        <div className="form-grid">
          <label className="field full">
            Product name
            <input
              name="name"
              required
              defaultValue={product?.name}
              placeholder="e.g. Yuzu Citrus"
              maxLength={80}
            />
          </label>
          <label className="field full">
            Description
            <textarea
              name="description"
              required
              defaultValue={product?.description}
              placeholder="What makes this drink special?"
            />
          </label>
          <label className="field">
            Category
            <select name="category" defaultValue={product?.category}>
              {[
                "Sparkling juice",
                "Craft soda",
                "Cola",
                "Summer cooler",
                "Cold brew",
                "Multipack",
                "Wholesale",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Status
            <select name="status" defaultValue={product?.status || "Draft"}>
              <option>Draft</option>
              <option>Active</option>
            </select>
          </label>
          <label className="field">
            Price · INR
            <input
              required
              name="price"
              type="number"
              min="1"
              step=".01"
              defaultValue={product?.price}
            />
          </label>
          <label className="field">
            Compare-at price · INR
            <input
              name="compareAt"
              type="number"
              min="0"
              step=".01"
              defaultValue={product?.compareAt}
            />
          </label>
          <label className="field full">
            Ingredients
            <textarea name="ingredients" defaultValue={product?.ingredients} />
          </label>
          <label className="field">
            Pack size
            <input
              required
              name="packSize"
              placeholder="12 × 250 ml"
              defaultValue={product?.packSize}
            />
          </label>
          <label className="field">
            Inventory
            <input
              required
              name="stock"
              type="number"
              min="0"
              step="1"
              defaultValue={product?.stock || 0}
            />
          </label>
          <label className="field">
            SKU
            <input
              name="sku"
              required
              placeholder="FZ-YZ-12"
              defaultValue={product?.sku}
            />
          </label>
          <label className="checkbox-field">
            <input
              name="wholesale"
              type="checkbox"
              defaultChecked={product?.wholesale}
            />
            Available for wholesale
          </label>
          <div className="full">
            <span className="field-label">Product image</span>
            <label
              className="upload-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                upload(e.dataTransfer.files[0]);
              }}
            >
              {image ? (
                <img src={image} alt="Uploaded product preview" />
              ) : (
                <Upload size={27} />
              )}
              <b>
                {image ? "Replace product image" : "Drop a product image here"}
              </b>
              <span>or click to browse · PNG, JPG, WebP up to 2 MB</span>
              <input
                type="file"
                aria-label="Upload product image"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
            {uploadError && <p role="alert">{uploadError}</p>}
          </div>
        </div>
        <div className="form-footer">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary">
            <Check size={16} />
            {product ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function Products() {
  const { data } = useStore();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All products");
  const [form, setForm] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [edit, setEdit] = useState<Product | undefined>();
  const [view, setView] = useState("table");
  const rows = data.products.filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) &&
      (filter === "All products" || p.status === filter),
  );
  return (
    <>
      <PageHeader
        title="Crafted to be loved."
        description="Your product catalog. From the first sip to the next bestseller."
      >
        <button
          className="btn primary"
          onClick={() => {
            setEdit(undefined);
            setForm(true);
          }}
        >
          <Plus size={16} />
          Add product
        </button>
      </PageHeader>
      <div className="catalog-summary">
        <div>
          <b>{data.products.length}</b>
          <span>Products in your collection</span>
        </div>
        <div>
          <b>{data.products.filter((p) => p.status === "Active").length}</b>
          <span>Active products</span>
        </div>
        <div>
          <b>
            {
              data.products.filter(
                (p) => p.stock < Number(data.settings.lowStock || 100),
              ).length
            }
          </b>
          <span>Need inventory attention</span>
        </div>
        <div className="catalog-3d-note">
          <Package size={21} />
          <span>
            Explore any product
            <br />
            <b>Interactive 3D packaging preview</b>
          </span>
        </div>
      </div>
      <Panel>
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              placeholder="Search products…"
              aria-label="Search products"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <select
            aria-label="Product status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {["All products", "Active", "Draft"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <div className="segmented push-right">
            <button
              aria-label="Table view"
              className={view === "table" ? "active" : ""}
              onClick={() => setView("table")}
            >
              <List size={16} />
            </button>
            <button
              aria-label="Grid view"
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
        {view === "table" ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {[
                    "Product",
                    "Category",
                    "Price",
                    "Stock",
                    "Units sold",
                    "Views",
                    "Conversion",
                    "Status",
                    "",
                  ].map((x, i) => (
                    <th key={i}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <button
                        className="product-cell"
                        onClick={() => setSelected(p)}
                      >
                        <span className="product-thumb-wrap">
                          <Can
                            small
                            tone={p.tone}
                            name={p.name}
                            image={p.image}
                          />
                        </span>
                        <span>
                          <b>{p.name}</b>
                          <small>
                            {p.packSize} · {p.sku}
                          </small>
                        </span>
                      </button>
                    </td>
                    <td>{p.category}</td>
                    <td className="strong">{money(p.price)}</td>
                    <td>
                      <span
                        className={
                          p.stock < Number(data.settings.lowStock || 100)
                            ? "stock-low"
                            : ""
                        }
                      >
                        {p.stock.toLocaleString()}
                        {p.stock < Number(data.settings.lowStock || 100)
                          ? " · Low"
                          : ""}
                      </span>
                    </td>
                    <td>{p.sold.toLocaleString()}</td>
                    <td>{p.views.toLocaleString()}</td>
                    <td>{p.conversion}%</td>
                    <td>
                      <Badge tone={p.status === "Active" ? "sea" : "neutral"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td>
                      <button
                        className="icon-btn"
                        aria-label={`View ${p.name}`}
                        onClick={() => setSelected(p)}
                      >
                        <ArrowUpRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="product-grid">
            {rows.map((p) => (
              <button
                className="product-tile"
                key={p.id}
                onClick={() => setSelected(p)}
              >
                <div>
                  <Can tone={p.tone} name={p.name} image={p.image} />
                </div>
                <span>
                  <b>{p.name}</b>
                  <small>{p.packSize}</small>
                </span>
                <strong>{money(p.price)}</strong>
              </button>
            ))}
          </div>
        )}
        {!rows.length && (
          <Empty
            title="No products found"
            text="Try another search or add your first product."
          />
        )}
        <div className="table-footer">
          {rows.length} products<span>Inventory is shown in packs</span>
        </div>
      </Panel>
      {form && <ProductForm product={edit} onClose={() => setForm(false)} />}{" "}
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)} wide>
          <div className="product-detail">
            <div className="product-stage">
              <Suspense fallback={<div className="skeleton chart" />}>
                <Product3D product={selected} />
              </Suspense>
            </div>
            <div>
              <span className="eyebrow">FIZZI COLLECTION / {selected.sku}</span>
              <h1>{selected.name}</h1>
              <p className="body-copy">{selected.description}</p>
              <Badge tone="sea">{selected.status}</Badge>
              <strong className="product-price">{money(selected.price)}</strong>
              <dl className="detail-list">
                <dt>Pack size</dt>
                <dd>{selected.packSize}</dd>
                <dt>Available stock</dt>
                <dd>{selected.stock} packs</dd>
                <dt>Ingredients</dt>
                <dd>{selected.ingredients}</dd>
                <dt>Wholesale</dt>
                <dd>{selected.wholesale ? "Available" : "Not available"}</dd>
              </dl>
              <button
                className="btn primary"
                onClick={() => {
                  setEdit(selected);
                  setSelected(null);
                  setForm(true);
                }}
              >
                Edit product
                <ArrowUpRight size={15} />
              </button>
            </div>
          </div>
          <div className="stat-strip">
            {[
              ["Product views", selected.views],
              ["Units sold", selected.sold],
              ["Conversion", `${selected.conversion}%`],
            ].map(([l, v]) => (
              <div key={l}>
                <small>{l}</small>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

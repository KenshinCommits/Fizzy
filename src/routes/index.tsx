import { useEffect, useRef, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { gsap } from "gsap";

import strawberryCan from "@/assets/can-strawberry.png";
import cherryCan from "@/assets/can-cherry-lime.png";
import mapleCan from "@/assets/can-maple-ginger.png";
import raspberryCan from "@/assets/can-raspberry.png";

import slide1 from "@/assets/slide-1.png";
import slide2 from "@/assets/slide-2.png";
import slide3 from "@/assets/slide-3.png";
import slide4 from "@/assets/slide-4.png";

import CanScene3D from "@/components/CanScene3D";
import FluidRibbon from "@/components/FluidRibbon";

type Flavor = {
  id: string;
  title: string[];
  description: string;
  image: string;
  bgImage: string;
  color: string;
  textColor: string;
  bg: {
    left: string;
    right: string;
    accent: string;
  };
  pack: string;
  price: string;
};

const flavors: Flavor[] = [
  {
    id: "watermelon-crush",
    title: ["watermelon", "crush"],
    description: "Cooler sips, bigger days. Refreshing sparkling watermelon craft soda made with real fruit juice, clean ingredients, and crisp bubbles.",
    image: "/textures/Watermelon.png",
    bgImage: slide1,
    color: "#e44d4d",
    textColor: "#212121",
    bg: {
      left: "#fffdfb",
      right: "#e7f4e8",
      accent: "#1b8d55",
    },
    pack: "A case of 24 cans (330ml)",
    price: "$74.50",
  },
  {
    id: "yuzu-citrus-fizz",
    title: ["yuzu citrus", "fizz"],
    description: "Bright citrus, bigger days. Zesty sparkling yuzu juice packed with sun-ripened citrus notes, natural flavours, and low sugar refreshment.",
    image: "/textures/FizzyLemonTexture.png",
    bgImage: slide2,
    color: "#f3cc36",
    textColor: "#212121",
    bg: {
      left: "#fffefa",
      right: "#fff3a6",
      accent: "#2789ce",
    },
    pack: "A case of 24 cans (330ml)",
    price: "$74.50",
  },
  {
    id: "berry-wave",
    title: ["berry", "wave"],
    description: "Mixed berries, higher moods. Crisp sparkling mixed berry and grape fusion bursting with dark berry sweetness and fizzy delight.",
    image: "/textures/FizzyGrapeTexture.png",
    bgImage: slide3,
    color: "#9255ad",
    textColor: "#212121",
    bg: {
      left: "#fffdfd",
      right: "#f0e6f6",
      accent: "#e5a6ca",
    },
    pack: "A case of 24 cans (330ml)",
    price: "$74.50",
  },
  {
    id: "mango-splash",
    title: ["mango", "splash"],
    description: "Juicy mango, endless summer. Pure tropical sunshine and real mango juice with sparkling soda bubbles, low calories, and good vibes.",
    image: "/textures/FizzyMangoTexture.png",
    bgImage: slide4,
    color: "#f47b20",
    textColor: "#212121",
    bg: {
      left: "#fffdf8",
      right: "#ffe28a",
      accent: "#f27b24",
    },
    pack: "A case of 24 cans (330ml)",
    price: "$74.50",
  },
];

type BasketLine = { id: string; quantity: number };
const BASKET_KEY = "fizzy-basket-v1";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fizzi — Cooler Sips, Bigger Days" },
      { name: "description", content: "Craft sparkling soda in four bright flavors: Watermelon Crush, Yuzu Citrus Fizz, Berry Wave, and Mango Splash." },
      { property: "og:title", content: "Fizzi — Cooler Sips, Bigger Days" },
      { property: "og:description", content: "Craft sparkling soda in four bright flavors: Watermelon Crush, Yuzu Citrus Fizz, Berry Wave, and Mango Splash." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const stageRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  const [activeFlavor, setActiveFlavor] = useState(0);
  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [panel, setPanel] = useState<"menu" | "basket" | "details" | "story" | null>(null);
  const [toast, setToast] = useState("");

  const isTransitioning = useRef(false);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const lastScrollTime = useRef<number>(0);

  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = basket.reduce((sum, item) => sum + 74.5 * item.quantity, 0);

  // Load and save basket
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(BASKET_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setBasket(parsed as BasketLine[]);
      }
    } catch {
      window.localStorage.removeItem(BASKET_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(BASKET_KEY, JSON.stringify(basket));
    } catch {
      // Storage unavailable fallback
    }
  }, [basket]);

  // Transition to target flavor with authentic Kombu can rolling & sliding
  const goToFlavor = useCallback(
    (targetIndex: number) => {
      if (
        targetIndex === activeFlavor ||
        targetIndex < 0 ||
        targetIndex >= flavors.length ||
        isTransitioning.current
      ) {
        return;
      }

      isTransitioning.current = true;
      const direction = targetIndex > activeFlavor ? 1 : -1;
      // Immediately activate new flavor for 3D rolling cans and fluid ribbon
      setActiveFlavor(targetIndex);

      const tl = gsap.timeline({
        onComplete: () => {
          isTransitioning.current = false;
        },
      });

      // 1. Text Copy exit to a clean directional slide, not a fade-out.
      if (titleRef.current && descRef.current && countRef.current) {
        tl.to(
          [countRef.current, titleRef.current, descRef.current],
          {
            x: -40 * direction,
            autoAlpha: 0,
            duration: 0.26,
            stagger: 0.04,
            ease: "power2.in",
          },
          0
        );
      }

      // 3. Text Copy entrance with a direct, crisp slide in.
      if (titleRef.current && descRef.current && countRef.current) {
        tl.fromTo(
          [countRef.current, titleRef.current, descRef.current],
          { x: 46 * direction, autoAlpha: 0 },
          {
            x: 0,
            autoAlpha: 1,
            duration: 0.52,
            stagger: 0.05,
            ease: "power2.out",
          },
          0.18
        );
      }
    },
    [activeFlavor]
  );

  // Wheel event listener: STOP ALL PAGE SCROLL and ONLY animate cans & fruits
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Always prevent page from scrolling vertically
      e.preventDefault();

      const now = Date.now();
      if (now - lastScrollTime.current < 550) return;

      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

      if (delta > 15) {
        // Scroll down / swipe forward -> next drink
        if (activeFlavor < flavors.length - 1) {
          lastScrollTime.current = now;
          goToFlavor(activeFlavor + 1);
        }
      } else if (delta < -15) {
        // Scroll up / swipe backward -> previous drink
        if (activeFlavor > 0) {
          lastScrollTime.current = now;
          goToFlavor(activeFlavor - 1);
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [activeFlavor, goToFlavor]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (panel) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (activeFlavor < flavors.length - 1) goToFlavor(activeFlavor + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (activeFlavor > 0) goToFlavor(activeFlavor - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFlavor, goToFlavor, panel]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    touchStartY.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = touchStartX.current - (e.changedTouches[0]?.clientX ?? 0);
    const diffY = touchStartY.current - (e.changedTouches[0]?.clientY ?? 0);

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0 && activeFlavor < flavors.length - 1) {
        goToFlavor(activeFlavor + 1);
      } else if (diffX < 0 && activeFlavor > 0) {
        goToFlavor(activeFlavor - 1);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Toast auto-clear
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const addToBasket = (id: string) => {
    setBasket((items) => {
      const existing = items.find((item) => item.id === id);
      return existing
        ? items.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
        : [...items, { id, quantity: 1 }];
    });
    setToast("Added to your basket");
  };

  const adjustQuantity = (id: string, amount: number) => {
    setBasket((items) =>
      items
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + amount } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const jumpToStory = () => {
    setPanel(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentFlavor: Flavor = (flavors[activeFlavor] ?? flavors[0]) as Flavor;

  return (
    <main className="story-container">
      {/* Hero interactive slider section */}
      <section
        className="story-stage"
        ref={stageRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Explore Fizzi flavors"
      >
        {/* Fluid animated diagonal ribbon with liquid wave distortion */}
        <FluidRibbon activeFlavor={activeFlavor} flavors={flavors} />

        {/* Global Navigation Header */}
        <header className="stage-header">
          <button
            className="menu-trigger"
            type="button"
            aria-label="Open menu"
            onClick={() => setPanel("menu")}
          >
            <span className="menu-lines" aria-hidden="true">
              <i />
              <i />
            </span>
          </button>

          <a
            className="wordmark"
            href="#top"
            onClick={(event) => {
              event.preventDefault();
              jumpToStory();
            }}
            aria-label="Fizzi home"
          >
            fizzi<span>✦</span>
          </a>

          <div className="header-actions">
            <button
              className="login-trigger"
              type="button"
              aria-label="Log in"
            >
              <span>Log in</span>
            </button>
            <button
              className="basket-trigger"
              type="button"
              onClick={() => setPanel("basket")}
              aria-label={`Open basket, ${totalItems} items`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path
                  d="M7 4H3v2h2l3.6 7.6-1.3 2.4A2 2 0 0 0 9 19h11v-2H9l1.1-2h7.4a2 2 0 0 0 1.8-1.1L23 7H7.4L7 4Zm2 17a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm10 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
                  transform="translate(-1 -1) scale(.92)"
                />
              </svg>
              <span>my basket ({totalItems})</span>
            </button>
          </div>
        </header>

        {/* Active Flavor Copy Container (Left) */}
        <div className="flavor-copy-container" ref={copyRef}>
          <div className="flavor-count" ref={countRef}>
            <span
              className="flavor-count-active"
              style={{ color: currentFlavor.color }}
            >
              0{activeFlavor + 1}
            </span>
            <span>／</span>
            <span>04</span>
          </div>

          <div className="flavor-title-wrap">
            <h1 className="flavor-title" ref={titleRef}>
              {currentFlavor.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h1>
          </div>

          <p className="flavor-description" ref={descRef}>
            {currentFlavor.description}
          </p>

          <p className="flavor-price">
            {currentFlavor.price} <span>({currentFlavor.pack})</span>
          </p>

          <div className="flavor-actions">
            <button
              className="story-button"
              type="button"
              style={{
                backgroundColor: currentFlavor.color,
                borderColor: currentFlavor.color,
                color: currentFlavor.textColor,
              }}
              onClick={() => addToBasket(currentFlavor.id)}
            >
              add to cart
            </button>
            <button
              className="story-button secondary"
              type="button"
              style={{
                borderColor: currentFlavor.color,
              }}
              onClick={() => setPanel("details")}
            >
              discover
            </button>
          </div>

          <a
            className="mix-link"
            href="#mixes"
            onClick={(event) => {
              event.preventDefault();
              setToast("Your mixed case is ready to explore");
            }}
          >
            Add a mixed case to your cart
          </a>
        </div>

        {/* Photorealistic 3D Cans Viewport: Exactly in the middle with 3D cylinder roll physics */}
        <CanScene3D
          activeFlavor={activeFlavor}
          canImages={flavors.map((f) => f.image)}
          flavorColors={flavors.map((f) => f.color)}
        />

        {/* Side Scroll Indicator */}
        <div className="story-scroll-note" aria-hidden="true">
          Scroll
        </div>

        {/* Interactive Flavor Controls (Arrows & Pagination Dots) */}
        <nav className="story-controls" aria-label="Choose a flavor">
          <button
            className="story-arrow"
            type="button"
            aria-label="Previous flavor"
            disabled={activeFlavor === 0}
            onClick={() => goToFlavor(activeFlavor - 1)}
          >
            ‹
          </button>

          {flavors.map((flavor, index) => (
            <button
              key={flavor.id}
              type="button"
              className={activeFlavor === index ? "is-active" : ""}
              style={
                activeFlavor === index
                  ? { backgroundColor: flavor.color, outlineColor: flavor.color }
                  : undefined
              }
              aria-label={`Show ${flavor.title.join(" ")}`}
              aria-current={activeFlavor === index ? "step" : undefined}
              onClick={() => goToFlavor(index)}
            />
          ))}

          <button
            className="story-arrow"
            type="button"
            aria-label="Next flavor"
            disabled={activeFlavor === flavors.length - 1}
            onClick={() => goToFlavor(activeFlavor + 1)}
          >
            ›
          </button>
        </nav>

        {/* Language switch */}
        <div className="language-switch" aria-label="Language">
          <button type="button" className="is-active">
            in
          </button>
          <span>|</span>
          <button type="button">fr</button>
        </div>
      </section>



      {/* Drawers and Panels */}
      {panel && (
        <div
          className="overlay-backdrop"
          onClick={() => setPanel(null)}
          aria-hidden="true"
        />
      )}

      {panel === "menu" && (
        <aside
          className="side-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-title"
        >
          <div className="panel-top">
            <h2 id="menu-title">Explore Fizzi</h2>
            <button
              className="icon-close"
              type="button"
              onClick={() => setPanel(null)}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
          <nav className="menu-list">
            {["The flavors", "Our story", "The good stuff", "Get in touch"].map(
              (item, index) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    if (index === 0) {
                      jumpToStory();
                    } else if (index === 1) {
                      setPanel("story");
                    } else {
                      setPanel(null);
                      setToast(`${item} is coming soon`);
                    }
                  }}
                >
                  <span>{item}</span>
                  <small>0{index + 1}</small>
                </button>
              )
            )}
          </nav>
        </aside>
      )}

      {panel === "basket" && (
        <aside
          className="side-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="basket-title"
        >
          <div className="panel-top">
            <h2 id="basket-title">My basket ({totalItems})</h2>
            <button
              className="icon-close"
              type="button"
              onClick={() => setPanel(null)}
              aria-label="Close basket"
            >
              ×
            </button>
          </div>
          {basket.length === 0 ? (
            <p className="empty-basket">Your basket is taking a little breather.</p>
          ) : (
            basket.map((item) => {
              const flavor = flavors.find((entry) => entry.id === item.id);
              if (!flavor) return null;
              return (
                <div className="basket-item" key={item.id}>
                  <img src={flavor.image} alt="" width={768} height={1200} />
                  <div>
                    <h3>{flavor.title.join(" ")}</h3>
                    <p>$74.50 · 24 cans</p>
                    <div className="quantity-control">
                      <button
                        type="button"
                        onClick={() => adjustQuantity(item.id, -1)}
                        aria-label={`Remove one ${flavor.title.join(" ")}`}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => adjustQuantity(item.id, 1)}
                        aria-label={`Add one ${flavor.title.join(" ")}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {basket.length > 0 && (
            <>
              <div className="basket-summary">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <button
                className="story-button"
                type="button"
                style={{
                  backgroundColor: currentFlavor.color,
                  borderColor: currentFlavor.color,
                  color: currentFlavor.textColor,
                  width: "100%",
                }}
                onClick={() => {
                  setPanel(null);
                  setToast("Checkout is ready for your next step");
                }}
              >
                Continue to checkout
              </button>
            </>
          )}
        </aside>
      )}

      {panel === "details" && (
        <aside
          className="side-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="details-title"
        >
          <div className="panel-top">
            <h2 id="details-title">{currentFlavor.title.join(" ")}</h2>
            <button
              className="icon-close"
              type="button"
              onClick={() => setPanel(null)}
              aria-label="Close details"
            >
              ×
            </button>
          </div>
          <div className="details-copy">
            <p>{currentFlavor.description}</p>
            <h3>Bright things inside</h3>
            <p>Fermented tea · real fruit and botanicals · lightly sparkling · 355 ml per can</p>
            <h3>Find your new favorite</h3>
            <p>Enjoy chilled, straight from the can or poured over ice.</p>
            <button
              className="story-button"
              type="button"
              style={{
                backgroundColor: currentFlavor.color,
                borderColor: currentFlavor.color,
                color: currentFlavor.textColor,
                marginTop: 20,
              }}
              onClick={() => {
                addToBasket(currentFlavor.id);
                setPanel(null);
              }}
            >
              Add a case · $74.50
            </button>
          </div>
        </aside>
      )}

      {panel === "story" && (
        <aside
          className="side-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="story-title"
        >
          <div className="panel-top">
            <h2 id="story-title">Our Story</h2>
            <button
              className="icon-close"
              type="button"
              onClick={() => setPanel(null)}
              aria-label="Close story"
            >
              ×
            </button>
          </div>
          <div className="details-copy">
            <h3>Good tea. Better moments.</h3>
            <p>
              Fruit-forward, full of good things, and made to find its way into your everyday. Pick a
              flavor and make a little room for brighter days.
            </p>
            <p>
              Brewed in four distinct botanical flavors; an invigorating alternative to sparkling,
              energy, or conventional canned beverages.
            </p>
            <button
              className="story-button"
              type="button"
              style={{
                backgroundColor: currentFlavor.color,
                borderColor: currentFlavor.color,
                color: currentFlavor.textColor,
                marginTop: 24,
              }}
              onClick={() => setPanel(null)}
            >
              Back to flavors
            </button>
          </div>
        </aside>
      )}

      {toast && (
        <div className="toast-note" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
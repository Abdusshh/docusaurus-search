import React, { createContext, useContext, useState, ReactNode } from 'react';

type ProductContextType = {
  hoveredProduct: string | null;
  setHoveredProduct: (product: string | null) => void;
};

const ProductContext = createContext<ProductContextType>({
  hoveredProduct: null,
  setHoveredProduct: () => {},
});

export function ProductProvider({ children }: { children: ReactNode }) {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  return (
    <ProductContext.Provider value={{ hoveredProduct, setHoveredProduct }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  return useContext(ProductContext);
}

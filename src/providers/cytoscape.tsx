import React, { createContext, useState } from 'react';
import { ExtendedCore } from '../components/pod-graph/cytoscape/interfaces';

interface CytoscapeContextValue {
  cytoscape: ExtendedCore | undefined;
  setCytoscape: (cy: ExtendedCore) => void
}

export const CytoscapeContext = createContext<CytoscapeContextValue>({
  cytoscape: undefined,
  setCytoscape: () => {},
});

interface Props {
  children: React.ReactNode;
}

const CytoscapeProvider : React.FC<Props> = ({ children }) => {
  const [cytoscape, setCytoscapeFunction] = useState<ExtendedCore>();

  const setCytoscape = (cy: ExtendedCore) => setCytoscapeFunction(cy);

  return (
    <CytoscapeContext.Provider
      value={{
        cytoscape,
        setCytoscape,
      }}
    >
      {children}
    </CytoscapeContext.Provider>
  );
};

export default CytoscapeProvider;

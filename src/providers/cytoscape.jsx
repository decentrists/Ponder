import React, { createContext, useState } from 'react';
import PropTypes from 'prop-types';

export const CytoscapeContext = createContext();

function CytoscapeProvider({ children }) {
  const [cytoscape, setCytoscape] = useState(null);

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
}

// CytoscapeProvider.propTypes = {
//   children: PropTypes.node.isRequired,
// };

export default CytoscapeProvider;

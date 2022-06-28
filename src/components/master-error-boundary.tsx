import React, { ErrorInfo } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { Button } from 'react-bootstrap';

interface Props extends RouteComponentProps {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

class MasterErrorBoundary extends React.Component<Props, State> {
  state : State = {
    error: null,
    info: null,
  };

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info });
  }

  render() {
    const { children, history } = this.props;
    const { error, info } = this.state;

    return error ? (
      <div>
        <p>{info?.componentStack}</p>
        <pre>{error.toString()}</pre>
        <Button
          variant="warn"
          onClick={() => history.goBack()}
        >
          Back
        </Button>
      </div>
    ) : children;
  }
}

export default withRouter(MasterErrorBoundary);

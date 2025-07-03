import React from 'react';

interface HelloWorldProps {
  name?: string;
}

const HelloWorld: React.FC<HelloWorldProps> = ({ name = 'World' }) => {
  return <h1>Hello, {name}!</h1>;
};

export default HelloWorld;
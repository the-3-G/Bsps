import React from 'react';
import { ThreadClient } from './ThreadClient';

export function generateStaticParams() {
  return [{ conversationId: 'demo' }];
}

export default function CustomerServiceThreadPage() {
  return <ThreadClient />;
}

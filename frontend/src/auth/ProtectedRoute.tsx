import { Navigate } from "react-router-dom";
import React from 'react';
import { useAuth } from "./auth.context";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/auth" />;
}

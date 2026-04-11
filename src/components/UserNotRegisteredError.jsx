import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UserNotRegisteredError() {
  function handleReload() {
    window.location.reload();
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h1 className="text-xl font-semibold">Usuário não cadastrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sua conta não possui acesso liberado para este aplicativo no momento.
        </p>

        <div className="mt-6 flex justify-center">
          <Button onClick={handleReload}>Tentar novamente</Button>
        </div>
      </div>
    </div>
  );
}
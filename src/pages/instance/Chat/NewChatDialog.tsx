import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSendMessage } from "@/lib/queries/chat/sendMessage";
import { useInstance } from "@/contexts/InstanceContext";
import { Loader2 } from "lucide-react";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewChatDialog({ open, onOpenChange }: NewChatDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("Olá!");
  const [isLoading, setIsLoading] = useState(false);
  const { instance } = useInstance();
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const { sendText } = useSendMessage();

  const formatPhoneNumber = (number: string): string => {
    // Remove todos os caracteres que não sejam dígitos
    const cleaned = number.replace(/\D/g, "");
    
    // Se começar com +, mantém
    if (number.startsWith("+")) {
      return cleaned;
    }
    
    // Se não tiver DDI (menos de 12 dígitos), adiciona 55 (Brasil)
    if (cleaned.length < 12) {
      return "55" + cleaned;
    }
    
    return cleaned;
  };

  const handleCreateChat = async () => {
    if (!phoneNumber.trim() || !instance?.name || !instance?.token) {
      return;
    }

    try {
      setIsLoading(true);
      
      const formattedNumber = formatPhoneNumber(phoneNumber);
      
      // Envia a mensagem inicial para criar a conversa
      await sendText({
        instanceName: instance.name,
        token: instance.token,
        data: {
          number: formattedNumber,
          text: message.trim() || "Olá!",
        },
      });

      // Aguarda um momento para garantir que a conversa foi criada
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navega para a nova conversa
      const remoteJid = `${formattedNumber}@s.whatsapp.net`;
      navigate(`/manager/instance/${instanceId}/chat/${remoteJid}`);

      // Limpa os campos e fecha o dialog
      setPhoneNumber("");
      setMessage("Olá!");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar conversa:", error);
      alert("Erro ao criar conversa. Verifique se o número está correto e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreateChat();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
          <DialogDescription>
            Digite o número de telefone (com DDD) para iniciar uma nova conversa.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="phone">Número de Telefone</Label>
            <Input
              id="phone"
              placeholder="21999999999 ou +5521999999999"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Formato: DDD + número (ex: 21999999999) ou com DDI (ex: +5521999999999)
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="message">Mensagem Inicial (opcional)</Label>
            <Input
              id="message"
              placeholder="Digite uma mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateChat} 
            disabled={!phoneNumber.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Conversa"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


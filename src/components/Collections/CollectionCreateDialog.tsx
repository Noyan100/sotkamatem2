"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CollectionManager } from "../Tasks/collectionManager";

interface CollectionCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCollectionCreated: () => void;
}

export const CollectionCreateDialog: React.FC<CollectionCreateDialogProps> = ({
  open,
  onOpenChange,
  onCollectionCreated,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать новую подборку</DialogTitle>
        </DialogHeader>
        <CollectionManager
          taskId={0} // Можно передать 0 или другое значение, если нужно
          onCollectionCreated={onCollectionCreated}
        />
      </DialogContent>
    </Dialog>
  );
};

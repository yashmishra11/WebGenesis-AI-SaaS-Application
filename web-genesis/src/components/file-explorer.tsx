import { CopyCheckIcon, CopyIcon, DownloadIcon, Loader2Icon } from "lucide-react";
import { useState, useMemo, useCallback, Fragment } from "react";
import JSZip from "jszip";
import { toast } from "sonner";

import { Hint } from "@/components/ui/hint";
import { Button } from "@/components/ui/button";
import { CodeView } from "./ui/code-view";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { TreeView } from "./tree-view";
import { TreeItem } from "@/types";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

type FileCollection = { [path: string]: string };

function getLanguageFromExtension(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  return extension || "text";
}

interface FileBreadcrumbProps {
  filePath: string;
}

const FileBreadcrumb = ({ filePath }: FileBreadcrumbProps) => {
  const pathSegments = filePath.split("/");
  const maxSegments = 3;

  const renderBreadcrumbItems = () => {
    if (pathSegments.length <= maxSegments) {
      // Show all segments if 3 or less
      return pathSegments.map((segment, index) => {
        const isLast = index === pathSegments.length - 1;
        return (
          <Fragment key={index}>
            <BreadcrumbItem>
              {isLast ? (
                <BreadcrumbPage className="font-medium">
                  {segment}
                </BreadcrumbPage>
              ) : (
                <span className="text-muted-foreground">{segment}</span>
              )}
            </BreadcrumbItem>
            {!isLast && <BreadcrumbSeparator />}
          </Fragment>
        );
      });
    } else {
      const firstSegment = pathSegments[0];
      const lastSegments = pathSegments[pathSegments.length - 1]; // Fixed: length not lenght
      return (
        <>
          <BreadcrumbItem>
            <span className="text-muted-foreground">{firstSegment}</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-medium">
              {lastSegments}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </>
      );
    }
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>{renderBreadcrumbItems()}</BreadcrumbList>

    </Breadcrumb>
  );
};

type FileTreeNode = { [key: string]: string | FileTreeNode };

// Convert files object to array-based tree structure
function convertFilesToTreeItems(files: FileCollection): TreeItem[] {
  const tree: FileTreeNode = {};

  // Build the tree structure
  Object.keys(files)
    .sort()
    .forEach((filePath) => {
      const parts = filePath.split("/").filter(Boolean);
      let current = tree;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;

        if (isFile) {
          // Store the FULL file path as the value
          current[part] = filePath;
        } else {
          // Create folder if it doesn't exist
          if (!current[part] || typeof current[part] === "string") {
            current[part] = {};
          }
          current = current[part] as FileTreeNode;
        }
      });
    });

  // Convert object tree to array format [name, children...]
  function objectToArray(obj: FileTreeNode | string, name?: string): TreeItem | TreeItem[] {
    if (typeof obj === "string") {
      // It's a file - return just the filename (the full path is stored in the tree)
      return name ?? obj;
    }

    // It's a folder - return [name, ...children]
    const children = Object.keys(obj)
      .sort()
      .map((key) => objectToArray(obj[key], key) as TreeItem);

    return name ? [name, ...children] : children;
  }

  const result = objectToArray(tree);
  return Array.isArray(result) ? (result as TreeItem[]) : [result];
}

interface FileExplorerProps {
  files: FileCollection;
}

export const FileExplorer = ({ files }: FileExplorerProps) => {
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(() => {
    const fileKeys = Object.keys(files);
    return fileKeys.length > 0 ? fileKeys[0] : null;
  });

  const handleCopy = useCallback(() => {
    if (selectedFile) {
      navigator.clipboard.writeText(files[selectedFile]);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [selectedFile, files]);

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();
      for (const [filePath, content] of Object.entries(files)) {
        const cleanPath = filePath.replace(/^\/+/, "");
        zip.file(cleanPath, content);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "webgenesis-project.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Project ZIP downloaded!");
    } catch (err) {
      console.error("ZIP download failed:", err);
      toast.error("Failed to generate ZIP archive");
    } finally {
      setIsZipping(false);
    }
  };

  const treeData = useMemo(() => {
    return convertFilesToTreeItems(files);
  }, [files]);

  const handleFileSelect = useCallback(
    (filePath: string) => {
      if (files[filePath]) {
        setSelectedFile(filePath);
      }
    },
    [files]
  );

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={30} minSize={30} className="bg-sidebar">
        <TreeView
          data={treeData}
          value={selectedFile ?? undefined}
          onSelect={handleFileSelect}
        />
      </ResizablePanel>
      <ResizableHandle className="hover:bg-primary transition-colors" />
      <ResizablePanel>
        {selectedFile && files[selectedFile] ? (
          <div className="h-full w-full flex flex-col">
            <div className="border-b bg-sidebar px-4 py-2 flex justify-between items-center gap-x-2">
              <FileBreadcrumb filePath={selectedFile} />
              <div className="ml-auto flex items-center gap-1.5">
                <Hint text="Download full project as ZIP" side="bottom">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleDownloadZip}
                    disabled={isZipping || Object.keys(files).length === 0}
                  >
                    {isZipping ? (
                      <Loader2Icon className="size-3.5 animate-spin" />
                    ) : (
                      <DownloadIcon className="size-3.5" />
                    )}
                    <span>{isZipping ? "Zipping..." : "Download ZIP"}</span>
                  </Button>
                </Hint>

                <Hint text="Copy file content" side="bottom">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCopy}
                    disabled={copied}
                  >
                    {copied ? <CopyCheckIcon className="size-3.5 text-emerald-500" /> : <CopyIcon className="size-3.5" />}
                  </Button>
                </Hint>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <CodeView
                code={files[selectedFile]}
                lang={getLanguageFromExtension(selectedFile)}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            {selectedFile
              ? `File not found: ${selectedFile}`
              : "Select a file to view its contents"}
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );

};
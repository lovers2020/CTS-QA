import React, { useState } from "react";
import { Doc, User as UserType, Folder as FolderType } from "../types";
import {
    Plus,
    FileText,
    ChevronRight,
    Folder,
    User as UserIcon,
    FolderPlus,
    ChevronDown,
    FolderOpen,
    Trash2,
    Sparkles,
    Wand2,
    Loader2,
    Share,
    Lock,
    Edit2,
} from "lucide-react";
import { assistWriting } from "../services/geminiService";

interface WorkspaceProps {
    user: UserType;
    docs: Doc[];
    folders: FolderType[];
    onUpdateDoc: (doc: Doc) => void;
    onAddDoc: (doc: Doc) => void;
    onDeleteDoc: (id: string) => void;
    onAddFolder: (folder: FolderType) => void;
    onUpdateFolder: (folder: FolderType) => void;
    onDeleteFolder: (id: string) => void;
}

const Workspace: React.FC<WorkspaceProps> = ({
    user,
    docs,
    folders,
    onUpdateDoc,
    onAddDoc,
    onDeleteDoc,
    onAddFolder,
    onUpdateFolder,
    onDeleteFolder,
}) => {
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        new Set(),
    );

    // Folder Creation State
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    // Team Folder Creation State
    const [isCreatingTeamFolder, setIsCreatingTeamFolder] = useState(false);
    const [newTeamFolderName, setNewTeamFolderName] = useState("");

    // Renaming State
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renamingType, setRenamingType] = useState<"doc" | "folder" | null>(
        null,
    );
    const [tempName, setTempName] = useState("");

    // AI State
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [showAiMenu, setShowAiMenu] = useState(false);

    // Personal docs: Filter by user and category.
    const allPersonalDocs = docs.filter(
        (d) => d.authorId === user.id && d.category === "Personal",
    );
    // Root docs are those without a folderId
    const rootPersonalDocs = allPersonalDocs.filter((d) => !d.folderId);

    const userFolders = folders.filter(
        (f) =>
            f.userId === user.id && (!f.category || f.category === "Personal"),
    );
    const teamFolders = folders.filter((f) => f.category === "Team");

    const teamDocs = docs.filter((d) => d.category === "Team");
    const rootTeamDocs = teamDocs.filter((d) => !d.folderId);

    const selectedDoc = docs.find((d) => d.id === selectedDocId);

    const toggleFolder = (folderId: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    const handleCreateFolderSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const nameToUse = newFolderName.trim() || "새 폴더";

        const newFolder: FolderType = {
            id: Math.random().toString(36).substr(2, 9),
            name: nameToUse,
            userId: user.id,
            createdAt: new Date().toISOString(),
            category: "Personal",
        };
        onAddFolder(newFolder);
        const newExpanded = new Set(expandedFolders);
        newExpanded.add(newFolder.id);
        setExpandedFolders(newExpanded);

        setNewFolderName("");
        setIsCreatingFolder(false);
    };

    const handleCreateTeamFolderSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const nameToUse = newTeamFolderName.trim() || "새 팀 폴더";

        const newFolder: FolderType = {
            id: Math.random().toString(36).substr(2, 9),
            name: nameToUse,
            userId: user.id, // Creator
            createdAt: new Date().toISOString(),
            category: "Team",
        };
        onAddFolder(newFolder);
        const newExpanded = new Set(expandedFolders);
        newExpanded.add(newFolder.id);
        setExpandedFolders(newExpanded);

        setNewTeamFolderName("");
        setIsCreatingTeamFolder(false);
    };

    const handleCancelCreateFolder = () => {
        setIsCreatingFolder(false);
        setNewFolderName("");
    };

    const handleCancelCreateTeamFolder = () => {
        setIsCreatingTeamFolder(false);
        setNewTeamFolderName("");
    };

    const handleCancelRenaming = () => {
        setRenamingId(null);
        setRenamingType(null);
        setTempName("");
    };

    const handleStartRenaming = (
        id: string,
        currentName: string,
        type: "doc" | "folder",
    ) => {
        setRenamingId(id);
        setRenamingType(type);
        setTempName(currentName);
    };

    const handleFinishRenaming = () => {
        if (!renamingId || !renamingType) return;

        if (renamingType === "folder") {
            const folder = folders.find((f) => f.id === renamingId);
            if (folder && tempName.trim() !== "") {
                onUpdateFolder({ ...folder, name: tempName });
            }
        } else {
            const doc = docs.find((d) => d.id === renamingId);
            if (doc && tempName.trim() !== "") {
                onUpdateDoc({
                    ...doc,
                    title: tempName,
                    updatedAt: new Date().toISOString(),
                });
            }
        }
        setRenamingId(null);
        setRenamingType(null);
        setTempName("");
    };

    const handleCreateDoc = (
        category: "Personal" | "Team",
        folderId?: string,
    ) => {
        const newDoc: Doc = {
            id: Math.random().toString(36).substr(2, 9),
            title: "제목 없는 페이지",
            content: "",
            authorId: user.id,
            authorName: user.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            emoji: "📄",
            category,
            folderId,
        };
        onAddDoc(newDoc);
        setSelectedDocId(newDoc.id);
    };

    const handleDeleteFolderInternal = (folderId: string) => {
        if (
            window.confirm(
                "폴더를 삭제하시겠습니까? 내부의 모든 문서가 루트로 이동합니다.",
            )
        ) {
            onDeleteFolder(folderId);
        }
    };

    const handleDeleteDocInternal = (docId: string) => {
        if (window.confirm("이 문서를 삭제하시겠습니까?")) {
            onDeleteDoc(docId);
            if (selectedDocId === docId) {
                setSelectedDocId(null);
            }
        }
    };

    const handleContentChange = (content: string) => {
        if (selectedDoc) {
            onUpdateDoc({
                ...selectedDoc,
                content,
                updatedAt: new Date().toISOString(),
            });
        }
    };

    const handleTitleChange = (title: string) => {
        if (selectedDoc) {
            onUpdateDoc({
                ...selectedDoc,
                title,
                updatedAt: new Date().toISOString(),
            });
        }
    };

    const handleEmojiChange = (emoji: string) => {
        if (selectedDoc) {
            onUpdateDoc({ ...selectedDoc, emoji });
        }
    };

    const handleCategoryToggle = () => {
        if (!selectedDoc) return;
        const newCategory =
            selectedDoc.category === "Personal" ? "Team" : "Personal";

        // If moving to Team, clear folderId (Team docs don't support folders in this UI yet)
        // If moving to Personal, it goes to root (folderId undefined)
        const newFolderId = undefined;

        if (newCategory === "Team") {
            if (
                !confirm(
                    "이 문서를 팀과 공유하시겠습니까? 모든 구성원이 볼 수 있게 됩니다.",
                )
            )
                return;
        } else {
            if (
                !confirm(
                    "이 문서를 개인 문서로 전환하시겠습니까? 다른 구성원은 더 이상 볼 수 없습니다.",
                )
            )
                return;
        }

        onUpdateDoc({
            ...selectedDoc,
            category: newCategory,
            folderId: newFolderId,
            updatedAt: new Date().toISOString(),
        });
    };

    const handleAiAction = async (command: "summarize" | "fix" | "expand") => {
        if (!selectedDoc || !selectedDoc.content) {
            alert("내용이 있는 문서에서만 사용할 수 있습니다.");
            return;
        }
        setIsAiLoading(true);
        setShowAiMenu(false);

        try {
            const result = await assistWriting(selectedDoc.content, command);
            if (command === "summarize") {
                const newContent = `> 🤖 **AI 요약**\n${result}\n\n---\n\n${selectedDoc.content}`;
                handleContentChange(newContent);
            } else if (command === "fix") {
                handleContentChange(result);
            } else if (command === "expand") {
                handleContentChange(selectedDoc.content + "\n\n" + result);
            }
        } catch (e) {
            alert("AI 처리 중 오류가 발생했습니다.");
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Sidebar List */}
            <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col overflow-y-auto">
                <div className="p-4 border-b border-slate-100">
                    {/* Personal Section */}
                    <div className="flex items-center justify-between mb-2 px-2">
                        <h2 className="text-sm font-semibold text-slate-500">
                            개인 페이지
                        </h2>
                        <button
                            type="button"
                            onClick={() => setIsCreatingFolder(true)}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                            title="새 폴더"
                        >
                            <FolderPlus size={16} />
                        </button>
                    </div>

                    <div className="space-y-1 mb-6">
                        {/* New Folder Input Form */}
                        {isCreatingFolder && (
                            <form
                                onSubmit={handleCreateFolderSubmit}
                                className="mb-2 px-2"
                            >
                                <div className="flex items-center space-x-1">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newFolderName}
                                        onChange={(e) =>
                                            setNewFolderName(e.target.value)
                                        }
                                        onBlur={() =>
                                            handleCreateFolderSubmit()
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter")
                                                handleCreateFolderSubmit();
                                            if (e.key === "Escape")
                                                handleCancelCreateFolder();
                                        }}
                                        className="w-full text-xs border border-blue-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="폴더 이름..."
                                    />
                                </div>
                            </form>
                        )}

                        {/* Folders */}
                        {userFolders.map((folder) => {
                            const isExpanded = expandedFolders.has(folder.id);
                            const folderDocs = allPersonalDocs.filter(
                                (d) => d.folderId === folder.id,
                            );
                            const isRenaming =
                                renamingId === folder.id &&
                                renamingType === "folder";

                            return (
                                <div key={folder.id}>
                                    <div className="group flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-md transition-colors text-slate-600 hover:bg-slate-200/50 cursor-pointer">
                                        {isRenaming ? (
                                            <input
                                                autoFocus
                                                type="text"
                                                value={tempName}
                                                onChange={(e) =>
                                                    setTempName(e.target.value)
                                                }
                                                onBlur={handleFinishRenaming}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter")
                                                        handleFinishRenaming();
                                                    if (e.key === "Escape")
                                                        handleCancelRenaming();
                                                }}
                                                className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            />
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleFolder(folder.id)
                                                }
                                                className="flex-1 flex items-center space-x-2 text-left truncate"
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown
                                                        size={14}
                                                        className="text-slate-400"
                                                    />
                                                ) : (
                                                    <ChevronRight
                                                        size={14}
                                                        className="text-slate-400"
                                                    />
                                                )}
                                                {isExpanded ? (
                                                    <FolderOpen
                                                        size={16}
                                                        className="text-blue-500"
                                                    />
                                                ) : (
                                                    <Folder
                                                        size={16}
                                                        className="text-blue-500"
                                                    />
                                                )}
                                                <span className="truncate font-medium">
                                                    {folder.name}
                                                </span>
                                            </button>
                                        )}

                                        {!isRenaming && (
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStartRenaming(
                                                            folder.id,
                                                            folder.name,
                                                            "folder",
                                                        );
                                                    }}
                                                    className="p-1 hover:bg-slate-300 rounded text-slate-400 hover:text-blue-500 transition-all mr-1"
                                                    title="이름 변경"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteFolderInternal(
                                                            folder.id,
                                                        );
                                                    }}
                                                    className="p-1 hover:bg-slate-300 rounded text-slate-400 hover:text-red-500 transition-all"
                                                    title="폴더 삭제"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {isExpanded && (
                                        <div className="ml-2 pl-2 border-l border-slate-200 space-y-1 mt-1">
                                            {folderDocs.map((doc) => {
                                                const isDocRenaming =
                                                    renamingId === doc.id &&
                                                    renamingType === "doc";
                                                return (
                                                    <div
                                                        key={doc.id}
                                                        className={`group flex items-center w-full px-2 py-1 text-sm rounded-md transition-colors cursor-pointer ${
                                                            selectedDocId ===
                                                            doc.id
                                                                ? "bg-slate-200 text-slate-900"
                                                                : "text-slate-500 hover:bg-slate-100"
                                                        }`}
                                                    >
                                                        {isDocRenaming ? (
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                value={tempName}
                                                                onChange={(e) =>
                                                                    setTempName(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                onBlur={
                                                                    handleFinishRenaming
                                                                }
                                                                onKeyDown={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.key ===
                                                                        "Enter"
                                                                    )
                                                                        handleFinishRenaming();
                                                                    if (
                                                                        e.key ===
                                                                        "Escape"
                                                                    )
                                                                        handleCancelRenaming();
                                                                }}
                                                                className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            />
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedDocId(
                                                                        doc.id,
                                                                    )
                                                                }
                                                                className="flex-1 flex items-center space-x-2 truncate text-left"
                                                            >
                                                                <span className="text-base">
                                                                    {doc.emoji}
                                                                </span>
                                                                <span className="truncate">
                                                                    {doc.title}
                                                                </span>
                                                            </button>
                                                        )}

                                                        {!isDocRenaming && (
                                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    type="button"
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleStartRenaming(
                                                                            doc.id,
                                                                            doc.title,
                                                                            "doc",
                                                                        );
                                                                    }}
                                                                    className="p-1 hover:bg-slate-300 rounded text-slate-400 hover:text-blue-500 transition-all mr-1"
                                                                    title="이름 변경"
                                                                >
                                                                    <Edit2
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCreateDoc(
                                                        "Personal",
                                                        folder.id,
                                                    )
                                                }
                                                className="w-full flex items-center space-x-2 px-2 py-1 text-xs text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors"
                                            >
                                                <Plus size={12} />
                                                <span>페이지 추가</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Root Docs */}
                        {rootPersonalDocs.map((doc) => {
                            const isDocRenaming =
                                renamingId === doc.id && renamingType === "doc";
                            return (
                                <div
                                    key={doc.id}
                                    className={`group flex items-center w-full px-2 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                                        selectedDocId === doc.id
                                            ? "bg-slate-200 text-slate-900"
                                            : "text-slate-600 hover:bg-slate-200/50"
                                    }`}
                                >
                                    {isDocRenaming ? (
                                        <input
                                            autoFocus
                                            type="text"
                                            value={tempName}
                                            onChange={(e) =>
                                                setTempName(e.target.value)
                                            }
                                            onBlur={handleFinishRenaming}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                    handleFinishRenaming();
                                                if (e.key === "Escape")
                                                    handleCancelRenaming();
                                            }}
                                            className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedDocId(doc.id)
                                            }
                                            className="flex-1 flex items-center space-x-2 truncate text-left"
                                        >
                                            <span className="text-base">
                                                {doc.emoji}
                                            </span>
                                            <span className="truncate">
                                                {doc.title}
                                            </span>
                                        </button>
                                    )}

                                    {!isDocRenaming && (
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStartRenaming(
                                                        doc.id,
                                                        doc.title,
                                                        "doc",
                                                    );
                                                }}
                                                className="p-1 hover:bg-slate-300 rounded text-slate-400 hover:text-blue-500 transition-all mr-1"
                                                title="이름 변경"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <button
                            type="button"
                            onClick={() => handleCreateDoc("Personal")}
                            className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                        >
                            <Plus size={14} />
                            <span>새 페이지 추가</span>
                        </button>
                    </div>

                    {/* Team Section */}
                    <div className="flex items-center justify-between mb-2 px-2 mt-6 border-t border-slate-100 pt-4">
                        <h2 className="text-sm font-semibold text-slate-500">
                            팀 공유 문서
                        </h2>
                        <button
                            type="button"
                            onClick={() => setIsCreatingTeamFolder(true)}
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                            title="새 팀 폴더"
                        >
                            <FolderPlus size={16} />
                        </button>
                    </div>

                    <div className="space-y-1">
                        {/* New Team Folder Input Form */}
                        {isCreatingTeamFolder && (
                            <form
                                onSubmit={handleCreateTeamFolderSubmit}
                                className="mb-2 px-2"
                            >
                                <div className="flex items-center space-x-1">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newTeamFolderName}
                                        onChange={(e) =>
                                            setNewTeamFolderName(e.target.value)
                                        }
                                        onBlur={() =>
                                            handleCreateTeamFolderSubmit()
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter")
                                                handleCreateTeamFolderSubmit();
                                            if (e.key === "Escape")
                                                handleCancelCreateTeamFolder();
                                        }}
                                        className="w-full text-xs border border-blue-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="팀 폴더 이름..."
                                    />
                                </div>
                            </form>
                        )}

                        {/* Team Folders */}
                        {teamFolders.map((folder) => {
                            const isExpanded = expandedFolders.has(folder.id);
                            const folderDocs = teamDocs.filter(
                                (d) => d.folderId === folder.id,
                            );
                            const isRenaming =
                                renamingId === folder.id &&
                                renamingType === "folder";

                            return (
                                <div key={folder.id}>
                                    <div className="group flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-md transition-colors text-slate-600 hover:bg-slate-200/50 cursor-pointer">
                                        {isRenaming ? (
                                            <input
                                                autoFocus
                                                type="text"
                                                value={tempName}
                                                onChange={(e) =>
                                                    setTempName(e.target.value)
                                                }
                                                onBlur={handleFinishRenaming}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter")
                                                        handleFinishRenaming();
                                                    if (e.key === "Escape")
                                                        handleCancelRenaming();
                                                }}
                                                className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            />
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleFolder(folder.id)
                                                }
                                                className="flex-1 flex items-center space-x-2 text-left truncate"
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown
                                                        size={14}
                                                        className="text-slate-400"
                                                    />
                                                ) : (
                                                    <ChevronRight
                                                        size={14}
                                                        className="text-slate-400"
                                                    />
                                                )}
                                                {isExpanded ? (
                                                    <FolderOpen
                                                        size={16}
                                                        className="text-indigo-500"
                                                    />
                                                ) : (
                                                    <Folder
                                                        size={16}
                                                        className="text-indigo-500"
                                                    />
                                                )}
                                                <span className="truncate font-medium">
                                                    {folder.name}
                                                </span>
                                            </button>
                                        )}

                                        {!isRenaming && (
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStartRenaming(
                                                            folder.id,
                                                            folder.name,
                                                            "folder",
                                                        );
                                                    }}
                                                    className="p-1 hover:bg-slate-300 rounded text-slate-400 hover:text-blue-500 transition-all mr-1"
                                                    title="이름 변경"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteFolderInternal(
                                                            folder.id,
                                                        );
                                                    }}
                                                    className="p-1 hover:bg-slate-300 rounded text-slate-400 hover:text-red-500 transition-all"
                                                    title="폴더 삭제"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {isExpanded && (
                                        <div className="ml-2 pl-2 border-l border-slate-200 space-y-1 mt-1">
                                            {folderDocs.map((doc) => {
                                                const isDocRenaming =
                                                    renamingId === doc.id &&
                                                    renamingType === "doc";
                                                return (
                                                    <div
                                                        key={doc.id}
                                                        className={`group flex items-center w-full px-2 py-1 text-sm rounded-md transition-colors cursor-pointer ${
                                                            selectedDocId ===
                                                            doc.id
                                                                ? "bg-slate-200 text-slate-900"
                                                                : "text-slate-500 hover:bg-slate-100"
                                                        }`}
                                                    >
                                                        {isDocRenaming ? (
                                                            <input
                                                                autoFocus
                                                                type="text"
                                                                value={tempName}
                                                                onChange={(e) =>
                                                                    setTempName(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                onBlur={
                                                                    handleFinishRenaming
                                                                }
                                                                onKeyDown={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.key ===
                                                                        "Enter"
                                                                    )
                                                                        handleFinishRenaming();
                                                                    if (
                                                                        e.key ===
                                                                        "Escape"
                                                                    )
                                                                        handleCancelRenaming();
                                                                }}
                                                                className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            />
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedDocId(
                                                                        doc.id,
                                                                    )
                                                                }
                                                                className="flex-1 flex items-center space-x-2 truncate text-left"
                                                            >
                                                                <span className="text-base">
                                                                    {doc.emoji}
                                                                </span>
                                                                <span className="truncate">
                                                                    {doc.title}
                                                                </span>
                                                            </button>
                                                        )}

                                                        {!isDocRenaming && (
                                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    type="button"
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleStartRenaming(
                                                                            doc.id,
                                                                            doc.title,
                                                                            "doc",
                                                                        );
                                                                    }}
                                                                    className="p-1 hover:bg-slate-300 rounded text-slate-400 hover:text-blue-500 transition-all mr-1"
                                                                    title="이름 변경"
                                                                >
                                                                    <Edit2
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleCreateDoc(
                                                        "Team",
                                                        folder.id,
                                                    )
                                                }
                                                className="w-full flex items-center space-x-2 px-2 py-1 text-xs text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors"
                                            >
                                                <Plus size={12} />
                                                <span>페이지 추가</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {rootTeamDocs.map((doc) => {
                            const isDocRenaming =
                                renamingId === doc.id && renamingType === "doc";
                            return (
                                <div
                                    key={doc.id}
                                    className={`group flex items-center w-full px-2 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                                        selectedDocId === doc.id
                                            ? "bg-slate-200 text-slate-900"
                                            : "text-slate-600 hover:bg-slate-200/50"
                                    }`}
                                >
                                    {isDocRenaming ? (
                                        <input
                                            autoFocus
                                            type="text"
                                            value={tempName}
                                            onChange={(e) =>
                                                setTempName(e.target.value)
                                            }
                                            onBlur={handleFinishRenaming}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter")
                                                    handleFinishRenaming();
                                                if (e.key === "Escape")
                                                    handleCancelRenaming();
                                            }}
                                            className="flex-1 text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSelectedDocId(doc.id)
                                            }
                                            className="flex-1 flex items-center space-x-2 truncate text-left"
                                        >
                                            <span className="text-base">
                                                {doc.emoji}
                                            </span>
                                            <span className="truncate">
                                                {doc.title}
                                            </span>
                                        </button>
                                    )}

                                    {!isDocRenaming && (
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStartRenaming(
                                                        doc.id,
                                                        doc.title,
                                                        "doc",
                                                    );
                                                }}
                                                className="p-1 hover:bg-slate-300 rounded text-slate-400 hover:text-blue-500 transition-all mr-1"
                                                title="이름 변경"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => handleCreateDoc("Team")}
                            className="w-full flex items-center space-x-2 px-2 py-1.5 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                        >
                            <Plus size={14} />
                            <span>새 공유 문서 추가</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col bg-white relative">
                {selectedDoc ? (
                    <>
                        {/* Toolbar */}
                        <div className="h-12 border-b border-slate-100 flex items-center justify-between px-6">
                            <div className="flex items-center text-sm text-slate-400 space-x-2">
                                <span className="flex items-center">
                                    <Folder size={14} className="mr-1" />
                                    {selectedDoc.category}
                                    {selectedDoc.folderId &&
                                        folders.find(
                                            (f) =>
                                                f.id === selectedDoc.folderId,
                                        ) && (
                                            <>
                                                <span className="mx-1">/</span>
                                                <span className="flex items-center">
                                                    {
                                                        folders.find(
                                                            (f) =>
                                                                f.id ===
                                                                selectedDoc.folderId,
                                                        )?.name
                                                    }
                                                </span>
                                            </>
                                        )}
                                </span>
                                <ChevronRight size={14} />
                                <span className="text-slate-600">
                                    {selectedDoc.title}
                                </span>
                            </div>

                            <div className="flex items-center space-x-2">
                                {/* Share/Private Toggle */}
                                <button
                                    onClick={handleCategoryToggle}
                                    className={`p-1.5 rounded-md transition-colors ${
                                        selectedDoc.category === "Team"
                                            ? "text-blue-500 hover:bg-blue-50"
                                            : "text-slate-400 hover:bg-slate-100"
                                    }`}
                                    title={
                                        selectedDoc.category === "Personal"
                                            ? "팀과 공유하기"
                                            : "개인 문서로 전환"
                                    }
                                >
                                    {selectedDoc.category === "Personal" ? (
                                        <Share size={18} />
                                    ) : (
                                        <Lock size={18} />
                                    )}
                                </button>

                                <div className="w-px h-4 bg-slate-200 mx-1"></div>

                                {/* AI Tools */}
                                <div className="relative">
                                    <button
                                        onClick={() =>
                                            setShowAiMenu(!showAiMenu)
                                        }
                                        disabled={isAiLoading}
                                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                            isAiLoading
                                                ? "bg-slate-100 text-slate-400 cursor-wait"
                                                : "text-violet-600 bg-violet-50 hover:bg-violet-100 hover:shadow-sm"
                                        }`}
                                    >
                                        {isAiLoading ? (
                                            <Loader2
                                                size={16}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Sparkles size={16} />
                                        )}
                                        <span>AI 도구</span>
                                    </button>

                                    {showAiMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-10 animate-scale-in overflow-hidden">
                                            <div className="p-1">
                                                <button
                                                    onClick={() =>
                                                        handleAiAction(
                                                            "summarize",
                                                        )
                                                    }
                                                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md flex items-center"
                                                >
                                                    <FileText
                                                        size={14}
                                                        className="mr-2 text-slate-400"
                                                    />
                                                    3줄 요약
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleAiAction("fix")
                                                    }
                                                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md flex items-center"
                                                >
                                                    <Wand2
                                                        size={14}
                                                        className="mr-2 text-slate-400"
                                                    />
                                                    맞춤법 교정
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleAiAction("expand")
                                                    }
                                                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md flex items-center"
                                                >
                                                    <Plus
                                                        size={14}
                                                        className="mr-2 text-slate-400"
                                                    />
                                                    내용 확장
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {/* Click outside to close - Simplified implementation using a backdrop if needed, or relying on user logic */}
                                    {showAiMenu && (
                                        <div
                                            className="fixed inset-0 z-0"
                                            onClick={() => setShowAiMenu(false)}
                                        ></div>
                                    )}
                                </div>

                                <div className="w-px h-4 bg-slate-200 mx-2"></div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDeleteDocInternal(selectedDoc.id)
                                    }
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                    title="문서 삭제"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-12 py-8 scrollbar-thin scrollbar-thumb-slate-200">
                            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
                                <div className="group relative">
                                    <button
                                        type="button"
                                        className="text-4xl hover:bg-slate-100 rounded-lg p-2 transition-colors cursor-pointer"
                                        onClick={() => {
                                            const newEmoji = prompt(
                                                "새 아이콘 이모지를 입력하세요:",
                                                selectedDoc.emoji,
                                            );
                                            if (newEmoji)
                                                handleEmojiChange(newEmoji);
                                        }}
                                    >
                                        {selectedDoc.emoji}
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    value={selectedDoc.title}
                                    onChange={(e) =>
                                        handleTitleChange(e.target.value)
                                    }
                                    className="w-full text-4xl font-bold text-slate-800 placeholder-slate-300 border-none focus:ring-0 p-0 bg-transparent"
                                    placeholder="제목 없음"
                                />

                                <div className="flex items-center space-x-4 text-sm text-slate-400 pb-4 border-b border-slate-100">
                                    <div className="flex items-center space-x-1">
                                        <UserIcon size={14} />
                                        <span>{selectedDoc.authorName}</span>
                                    </div>
                                    <span>•</span>
                                    <span>
                                        최종 수정:{" "}
                                        {new Date(
                                            selectedDoc.updatedAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>

                                <textarea
                                    value={selectedDoc.content}
                                    onChange={(e) =>
                                        handleContentChange(e.target.value)
                                    }
                                    placeholder="여기에 내용을 입력하세요..."
                                    className="w-full h-[calc(100vh-400px)] resize-none border-none focus:ring-0 p-0 text-lg leading-relaxed text-slate-700 placeholder-slate-300 bg-transparent focus:outline-none"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <FileText size={32} className="opacity-50" />
                        </div>
                        <p className="text-lg font-medium text-slate-600">
                            페이지를 선택하거나 새로 만드세요
                        </p>
                        <p className="text-sm mt-2">
                            왼쪽 사이드바에서 페이지를 관리할 수 있습니다.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Workspace;


import { useState, useEffect } from 'react';
import { KANBAN_API } from '../helper/api';
import { KanbanBoardDto, TaskDto } from '../interface/kanbanInterface';
import { toast } from 'sonner';
export function useKanbanBoard(boardId: number) {
  const [board, setBoard] = useState<KanbanBoardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadBoard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await KANBAN_API.getBoard(boardId);
      setBoard(data);
    } catch (error: any) {
      const msg = error.message || 'Không tải được board';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadBoard();
  }, [boardId]);
  const updateTaskPosition = async (
    taskId: number,
    newStatus: TaskDto['status'],
    position: number
  ) => {
    if (!board) return;
    const task = board.columns.flatMap(c => c.tasks).find(t => t.id === taskId);
    if (!task) return;
    const targetColumn = board.columns.find(c => c.status === newStatus);
    if (!targetColumn) {
      toast.error('Không tìm thấy cột đích');
      return;
    }
    const newColumns = board.columns.map(col => ({
      ...col,
      tasks: col.tasks.filter(t => t.id !== taskId),
    }));
    const targetIndex = newColumns.findIndex(c => c.status === newStatus);
    if (targetIndex !== -1) {
      newColumns[targetIndex].tasks.splice(position, 0, { ...task, status: newStatus });
    }
    setBoard({ columns: newColumns });
    try {
      const columnId = targetColumn.columnId || targetColumn.id || (targetIndex + 1);
      await KANBAN_API.updateTaskPosition({ 
        taskId, 
        columnId, 
        position 
      });
      toast.success('Di chuyển task thành công');
    } catch (error: any) {
      toast.error(error.message || 'Cập nhật vị trí task thất bại');
      loadBoard();
    }
  };
  return { board, loading, error, updateTaskPosition, reload: loadBoard };
}
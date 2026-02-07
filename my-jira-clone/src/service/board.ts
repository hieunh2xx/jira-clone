import { BOARD_API } from '../helper/api';
import { KanbanBoardDto, TaskDto, UpdateTaskPositionRequest } from '../interface/kanbanInterface';
export interface CreateSprintRequest {
  boardId: number;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
}
export interface AddTasksToSprintRequest {
  sprintId: number;
  taskIds: number[];
}
export const BoardService = {
  getBoard: (boardId: number): Promise<any> => {
    return BOARD_API.getBoard(boardId);
  },
  getTasks: (boardId: number): Promise<TaskDto[]> => {
    return BOARD_API.getTasks(boardId);
  },
  createSprint: (boardId: number, data: CreateSprintRequest): Promise<any> => {
    return BOARD_API.createSprint(boardId, { ...data, boardId });
  },
  getSprint: (sprintId: number): Promise<any> => {
    return BOARD_API.getSprint(sprintId);
  },
  addTasksToSprint: (sprintId: number, taskIds: number[]): Promise<void> => {
    return BOARD_API.addTasksToSprint(sprintId, { sprintId, taskIds });
  },
  updateTaskPosition: (data: UpdateTaskPositionRequest): Promise<void> => {
    return BOARD_API.updateTaskPosition(data);
  },
  reorderColumn: (columnId: number, boardId: number, taskIds: number[]): Promise<any> => {
    return BOARD_API.reorderColumn(columnId, boardId, taskIds);
  },
};
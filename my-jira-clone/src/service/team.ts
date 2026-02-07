import { TEAM_API } from '../helper/api';
export interface TeamDto {
  id: number;
  name: string;
  code?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  leadId?: number;
  leadName?: string;
  departmentId?: number;
  departmentName?: string;
  memberIds?: number[];
  memberNames?: string[];
}
export interface CreateTeamRequest {
  name: string;
  code?: string;
  departmentId: number;
  leadId?: number;
  description?: string;
}
export interface UpdateTeamRequest {
  name: string;
  code?: string;
  departmentId: number;
  leadId?: number;
  description?: string;
}
export const TeamService = {
  getAll: (keyword?: string): Promise<TeamDto[]> => {
    return TEAM_API.getAll(keyword);
  },
  getById: (id: number): Promise<TeamDto> => {
    return TEAM_API.getById(id);
  },
  create: (data: CreateTeamRequest): Promise<void> => {
    return TEAM_API.create(data);
  },
  update: (id: number, data: UpdateTeamRequest): Promise<void> => {
    return TEAM_API.update(id, data);
  },
  delete: (id: number): Promise<void> => {
    return TEAM_API.delete(id);
  },
  addMember: (id: number, userId: number): Promise<void> => {
    return TEAM_API.addMember(id, userId);
  },
  removeMember: (id: number, userId: number): Promise<void> => {
    return TEAM_API.removeMember(id, userId);
  },
};
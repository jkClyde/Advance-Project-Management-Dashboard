import { Project, ProjectMember, User, MemberRole, Visibility } from "@prisma/client";

export type ProjectWithMembers = Project & {
  members: (ProjectMember & {
    user: User;
  })[];
};

export type ProjectWithDetails = Project & {
  members: (ProjectMember & {
    user: User;
  })[];
  _count: {
    tasks: number;
    members: number;
  };
};

export type ProjectMemberWithUser = ProjectMember & {
  user: User;
};

export { MemberRole, Visibility };
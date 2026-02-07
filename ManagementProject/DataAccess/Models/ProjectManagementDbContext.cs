using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
namespace DataAccess.Models;
public partial class ProjectManagementDbContext : DbContext
{
    public ProjectManagementDbContext()
    {
    }
    public ProjectManagementDbContext(DbContextOptions<ProjectManagementDbContext> options)
        : base(options)
    {
    }
    public virtual DbSet<Board> Boards { get; set; }
    public virtual DbSet<BoardColumn> BoardColumns { get; set; }
    public virtual DbSet<Category> Categories { get; set; }
    public virtual DbSet<CustomField> CustomFields { get; set; }
    public virtual DbSet<Department> Departments { get; set; }
    public virtual DbSet<Epic> Epics { get; set; }
    public virtual DbSet<IssueType> IssueTypes { get; set; }
    public virtual DbSet<Project> Projects { get; set; }
    public virtual DbSet<Role> Roles { get; set; }
    public virtual DbSet<Sprint> Sprints { get; set; }
    public virtual DbSet<SprintTask> SprintTasks { get; set; }
    public virtual DbSet<Task> Tasks { get; set; }
    public virtual DbSet<TaskAssignment> TaskAssignments { get; set; }
    public virtual DbSet<TaskBoardPosition> TaskBoardPositions { get; set; }
    public virtual DbSet<TaskComment> TaskComments { get; set; }
    public virtual DbSet<TaskCommentImage> TaskCommentImages { get; set; }
    public virtual DbSet<TaskCommentFile> TaskCommentFiles { get; set; }
    public virtual DbSet<TaskCustomValue> TaskCustomValues { get; set; }
    public virtual DbSet<TaskFile> TaskFiles { get; set; }
    public virtual DbSet<TaskHistory> TaskHistories { get; set; }
    public virtual DbSet<TaskImage> TaskImages { get; set; }
    public virtual DbSet<Team> Teams { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<UserTeamAssignment> UserTeamAssignments { get; set; }
    public virtual DbSet<UserProjectAssignment> UserProjectAssignments { get; set; }
    public virtual DbSet<VwScrumBoardTask> VwScrumBoardTasks { get; set; }
    public virtual DbSet<VwTaskCommentsWithImage> VwTaskCommentsWithImages { get; set; }
    public virtual DbSet<WorkflowScheme> WorkflowSchemes { get; set; }
    public virtual DbSet<WorkflowStatus> WorkflowStatuses { get; set; }
    public virtual DbSet<WorkflowTransition> WorkflowTransitions { get; set; }
    public virtual DbSet<ProjectEvaluation> ProjectEvaluations { get; set; }
    public virtual DbSet<ProjectImprovement> ProjectImprovements { get; set; }
    public virtual DbSet<ProjectTrialEvaluation> ProjectTrialEvaluations { get; set; }
    public virtual DbSet<ProjectImage> ProjectImages { get; set; }
    public virtual DbSet<ProjectProcess> ProjectProcesses { get; set; }
    public virtual DbSet<Notification> Notifications { get; set; }
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            var configuration = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .Build();
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            optionsBuilder.UseSqlServer(connectionString);
        }
    }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Board>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Boards__3213E83F33BCF6EB");
            entity.HasIndex(e => new { e.ProjectId, e.Type, e.IsActive }, "IX_Boards_Project_Type_Active");
            entity.HasIndex(e => e.ProjectId, "idx_project");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DefaultIssueTypeId).HasColumnName("default_issue_type_id");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.QuickFiltersJson).HasColumnName("quick_filters_json");
            entity.Property(e => e.Type)
                .HasMaxLength(20)
                .HasColumnName("type");
            entity.HasOne(d => d.DefaultIssueType).WithMany(p => p.Boards)
                .HasForeignKey(d => d.DefaultIssueTypeId)
                .HasConstraintName("fk_board_default_issue_type");
            entity.HasOne(d => d.Project).WithMany(p => p.Boards)
                .HasForeignKey(d => d.ProjectId)
                .HasConstraintName("fk_board_project");
        });
        modelBuilder.Entity<BoardColumn>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__BoardCol__3213E83FD1E46754");
            entity.HasIndex(e => new { e.BoardId, e.Position }, "IX_BoardColumns_Board_Position").IsUnique();
            entity.HasIndex(e => e.WorkflowStatusId, "IX_BoardColumns_Status");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BoardId).HasColumnName("board_id");
            entity.Property(e => e.IsHidden)
                .HasDefaultValue(false)
                .HasColumnName("is_hidden");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
            entity.Property(e => e.Position).HasColumnName("position");
            entity.Property(e => e.WipLimit).HasColumnName("wip_limit");
            entity.Property(e => e.WorkflowStatusId).HasColumnName("workflow_status_id");
            entity.HasOne(d => d.Board).WithMany(p => p.BoardColumns)
                .HasForeignKey(d => d.BoardId)
                .HasConstraintName("fk_column_board");
            entity.HasOne(d => d.WorkflowStatus).WithMany(p => p.BoardColumns)
                .HasForeignKey(d => d.WorkflowStatusId)
                .HasConstraintName("fk_column_status");
        });
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Categori__3213E83F1C2624C8");
            entity.HasIndex(e => e.Name, "UQ__Categori__72E12F1BA8C695CA").IsUnique();
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Color)
                .HasMaxLength(7)
                .HasDefaultValue("#3B82F6")
                .HasColumnName("color");
            entity.Property(e => e.Icon)
                .HasMaxLength(50)
                .HasColumnName("icon");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
        });
        modelBuilder.Entity<CustomField>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__CustomFi__3213E83F4B3E5521");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.Type)
                .HasMaxLength(20)
                .HasColumnName("type");
            entity.HasOne(d => d.Project).WithMany(p => p.CustomFields)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_custom_project");
        });
        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Departme__3213E83F41696F3E");
            entity.HasIndex(e => e.Code, "UQ__Departme__357D4CF96AA95FED").IsUnique();
            entity.HasIndex(e => e.Code, "idx_code");
            entity.HasIndex(e => e.ManagerId, "idx_manager");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Code)
                .HasMaxLength(10)
                .HasColumnName("code");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.ManagerId).HasColumnName("manager_id");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.HasOne(d => d.Manager).WithMany(p => p.Departments)
                .HasForeignKey(d => d.ManagerId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_dept_manager");
        });
        modelBuilder.Entity<Epic>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Epics__3213E83FF30A7026");
            entity.HasIndex(e => e.ProjectId, "idx_project");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .HasColumnName("name");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.Summary).HasColumnName("summary");
            entity.HasOne(d => d.Project).WithMany(p => p.Epics)
                .HasForeignKey(d => d.ProjectId)
                .HasConstraintName("FK__Epics__project_i__619B8048");
        });
        modelBuilder.Entity<IssueType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__IssueTyp__3213E83FAF391755");
            entity.HasIndex(e => e.Name, "UQ__IssueTyp__72E12F1BE2765C27").IsUnique();
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Icon)
                .HasMaxLength(50)
                .HasColumnName("icon");
            entity.Property(e => e.IsSubtask)
                .HasDefaultValue(false)
                .HasColumnName("is_subtask");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
        });
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id)
                .HasName("PK__Projects__3213E83EAC786B3C")
                .IsClustered(false);
            entity.HasIndex(e => e.Code, "UQ__Projects__357D4CF9150F8BFB").IsUnique();
            entity.HasIndex(e => new { e.TeamId, e.Status }, "idx_clustered").IsClustered();
            entity.HasIndex(e => e.Code, "idx_code");
            entity.HasIndex(e => new { e.StartDate, e.DueDate }, "idx_dates");
            entity.HasIndex(e => e.Status, "idx_status");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Code)
                .HasMaxLength(20)
                .HasColumnName("code");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.DueDate).HasColumnName("due_date");
            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .HasColumnName("name");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("planning")
                .HasColumnName("status");
            entity.Property(e => e.TeamId).HasColumnName("team_id");
            entity.Property(e => e.IsCompleted)
                .HasDefaultValue(false)
                .HasColumnName("is_completed");
            entity.Property(e => e.CompletedAt)
                .HasColumnType("datetime")
                .HasColumnName("completed_at");
            entity.Property(e => e.RequiresEvaluation)
                .HasDefaultValue(false)
                .HasColumnName("requires_evaluation");
            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.Projects)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK__Projects__create__5AEE82B9");
            entity.HasOne(d => d.Team).WithMany(p => p.Projects)
                .HasForeignKey(d => d.TeamId)
                .HasConstraintName("FK__Projects__team_i__59FA5E80");
        });
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Roles__3213E83F7A4C0F60");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Level).HasColumnName("level");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
        });
        modelBuilder.Entity<Sprint>(entity =>
        {
            entity.HasIndex(e => new { e.BoardId, e.CompletedDate }, "IX_Sprints_Board_Completed");
            entity.HasIndex(e => new { e.BoardId, e.Status }, "IX_Sprints_Board_Status");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BoardId).HasColumnName("board_id");
            entity.Property(e => e.CompletedDate)
                .HasColumnType("datetime")
                .HasColumnName("completed_date");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.Goal).HasColumnName("goal");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("planning")
                .HasColumnName("status");
            entity.HasOne(d => d.Board).WithMany(p => p.Sprints)
                .HasForeignKey(d => d.BoardId)
                .HasConstraintName("fk_sprint_board");
            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.Sprints)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("fk_sprint_creator");
        });
        modelBuilder.Entity<SprintTask>(entity =>
        {
            entity.HasKey(e => new { e.SprintId, e.TaskId }).HasName("PK__SprintTa__F925394AA625E09E");
            entity.HasIndex(e => e.TaskId, "IX_SprintTasks_Task");
            entity.Property(e => e.SprintId).HasColumnName("sprint_id");
            entity.Property(e => e.TaskId).HasColumnName("task_id");
            entity.Property(e => e.AddedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("added_at");
            entity.HasOne(d => d.Sprint).WithMany(p => p.SprintTasks)
                .HasForeignKey(d => d.SprintId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(d => d.Task).WithMany(p => p.SprintTasks)
                .HasForeignKey(d => d.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<Task>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Tasks__3213E83FDDE65264");
            entity.HasIndex(e => e.DueDate, "idx_due_date");
            entity.HasIndex(e => e.EpicId, "idx_epic");
            entity.HasIndex(e => e.IssueTypeId, "idx_issue_type");
            entity.HasIndex(e => e.ParentTaskId, "idx_parent");
            entity.HasIndex(e => e.Priority, "idx_priority");
            entity.HasIndex(e => new { e.ProjectId, e.Status }, "idx_project_status");
            entity.HasIndex(e => new { e.Status, e.Priority }, "idx_status_priority");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ActualHours)
                .HasDefaultValue(0.0m)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("actual_hours");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.DueDate)
                .HasColumnType("datetime")
                .HasColumnName("due_date");
            entity.Property(e => e.EpicId).HasColumnName("epic_id");
            entity.Property(e => e.EstimatedHours)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("estimated_hours");
            entity.Property(e => e.IssueTypeId)
                .HasDefaultValue(3L)
                .HasColumnName("issue_type_id");
            entity.Property(e => e.ParentTaskId).HasColumnName("parent_task_id");
            entity.Property(e => e.Priority)
                .HasMaxLength(20)
                .HasDefaultValue("medium")
                .HasColumnName("priority");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValue("todo")
                .HasColumnName("status");
            entity.Property(e => e.Title)
                .HasMaxLength(255)
                .HasColumnName("title");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.Tasks)
                .HasForeignKey(d => d.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_task_created_by");
            entity.HasOne(d => d.Epic).WithMany(p => p.Tasks)
                .HasForeignKey(d => d.EpicId)
                .HasConstraintName("fk_task_epic");
            entity.HasOne(d => d.IssueType).WithMany(p => p.Tasks)
                .HasForeignKey(d => d.IssueTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_task_issue_type");
            entity.HasOne(d => d.ParentTask).WithMany(p => p.InverseParentTask)
                .HasForeignKey(d => d.ParentTaskId)
                .HasConstraintName("fk_task_parent");
            entity.HasOne(d => d.Project).WithMany(p => p.Tasks)
                .HasForeignKey(d => d.ProjectId)
                .HasConstraintName("fk_task_project");
            entity.HasMany(d => d.Categories).WithMany(p => p.Tasks)
                .UsingEntity<Dictionary<string, object>>(
                    "TaskCategory",
                    r => r.HasOne<Category>().WithMany()
                        .HasForeignKey("CategoryId")
                        .HasConstraintName("fk_taskcat_cat"),
                    l => l.HasOne<Task>().WithMany()
                        .HasForeignKey("TaskId")
                        .HasConstraintName("fk_taskcat_task"),
                    j =>
                    {
                        j.HasKey("TaskId", "CategoryId").HasName("PK__TaskCate__59C6FA161F80A527");
                        j.ToTable("TaskCategories");
                        j.HasIndex(new[] { "CategoryId" }, "idx_category");
                        j.IndexerProperty<long>("TaskId").HasColumnName("task_id");
                        j.IndexerProperty<long>("CategoryId").HasColumnName("category_id");
                    });
        });
        modelBuilder.Entity<TaskAssignment>(entity =>
        {
            entity.HasKey(e => e.Id)
                .HasName("PK__TaskAssi__3213E83E9F4A9574")
                .IsClustered(false);
            entity.HasIndex(e => new { e.TaskId, e.UserId }, "UQ__TaskAssi__EF09F7FCFA5063BD").IsUnique();
            entity.HasIndex(e => e.AssignedBy, "idx_assigned_by");
            entity.HasIndex(e => new { e.UserId, e.TaskId }, "idx_clustered").IsClustered();
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AssignedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("assigned_at");
            entity.Property(e => e.AssignedBy).HasColumnName("assigned_by");
            entity.Property(e => e.TaskId).HasColumnName("task_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.HasOne(d => d.AssignedByNavigation).WithMany(p => p.TaskAssignmentAssignedByNavigations)
                .HasForeignKey(d => d.AssignedBy)
                .HasConstraintName("fk_assignment_by");
            entity.HasOne(d => d.Task).WithMany(p => p.TaskAssignments)
                .HasForeignKey(d => d.TaskId)
                .HasConstraintName("fk_assignment_task");
            entity.HasOne(d => d.User).WithMany(p => p.TaskAssignmentUsers)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_assignment_user");
        });
        modelBuilder.Entity<TaskBoardPosition>(entity =>
        {
            entity.HasKey(e => new { e.TaskId, e.BoardId }).HasName("PK__TaskBoar__8B23DDE3A0E52C41");
            entity.HasIndex(e => new { e.BoardId, e.ColumnId, e.Position }, "IX_TaskBoardPositions_Board_Column_Position");
            entity.Property(e => e.TaskId).HasColumnName("task_id");
            entity.Property(e => e.BoardId).HasColumnName("board_id");
            entity.Property(e => e.ColumnId).HasColumnName("column_id");
            entity.Property(e => e.Position).HasColumnName("position");
            entity.HasOne(d => d.Task).WithMany(p => p.TaskBoardPositions)
                .HasForeignKey(d => d.TaskId)
                .HasConstraintName("fk_pos_task");
        });
        modelBuilder.Entity<TaskComment>(entity =>
        {
            entity.HasKey(e => e.Id)
                .HasName("PK__TaskComm__3213E83E1B76CBA0")
                .IsClustered(false);
            entity.HasIndex(e => new { e.TaskId, e.CreatedAt }, "idx_clustered")
                .IsDescending(false, true)
                .IsClustered();
            entity.HasIndex(e => new { e.IsReview, e.Rating }, "idx_review");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.ImageUrl)
                .HasMaxLength(500)
                .HasColumnName("image_url");
            entity.Property(e => e.IsReview)
                .HasDefaultValue(false)
                .HasColumnName("is_review");
            entity.Property(e => e.ParentCommentId).HasColumnName("parent_comment_id");
            entity.Property(e => e.Rating).HasColumnName("rating");
            entity.Property(e => e.TaskId).HasColumnName("task_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.HasOne(d => d.ParentComment).WithMany(p => p.InverseParentComment)
                .HasForeignKey(d => d.ParentCommentId)
                .HasConstraintName("fk_comment_parent");
            entity.HasOne(d => d.Task).WithMany(p => p.TaskComments)
                .HasForeignKey(d => d.TaskId)
                .HasConstraintName("fk_comment_task");
            entity.HasOne(d => d.User).WithMany(p => p.TaskComments)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_comment_user");
        });
        modelBuilder.Entity<TaskCommentImage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__TaskComm__3213E83FF7503785");
            entity.HasIndex(e => e.CommentId, "idx_comment");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CommentId).HasColumnName("comment_id");
            entity.Property(e => e.FileName)
                .HasMaxLength(255)
                .HasColumnName("file_name");
            entity.Property(e => e.FileSizeKb).HasColumnName("file_size_kb");
            entity.Property(e => e.ImageUrl)
                .HasMaxLength(500)
                .HasColumnName("image_url");
            entity.Property(e => e.UploadedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("uploaded_at");
            entity.Property(e => e.UploadedBy).HasColumnName("uploaded_by");
            entity.HasOne(d => d.Comment).WithMany(p => p.TaskCommentImages)
                .HasForeignKey(d => d.CommentId)
                .HasConstraintName("fk_img_comment");
            entity.HasOne(d => d.UploadedByNavigation).WithMany(p => p.TaskCommentImages)
                .HasForeignKey(d => d.UploadedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_img_user");
        });
        modelBuilder.Entity<TaskCommentFile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__TaskComm__3213E83F_TaskCommentFile");
            entity.HasIndex(e => e.CommentId, "idx_comment_file");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CommentId).HasColumnName("comment_id");
            entity.Property(e => e.FileName)
                .HasMaxLength(255)
                .HasColumnName("file_name");
            entity.Property(e => e.FileSizeKb).HasColumnName("file_size_kb");
            entity.Property(e => e.FileUrl)
                .HasMaxLength(500)
                .HasColumnName("file_url");
            entity.Property(e => e.UploadedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("uploaded_at");
            entity.Property(e => e.UploadedBy).HasColumnName("uploaded_by");
            entity.HasOne(d => d.Comment).WithMany(p => p.TaskCommentFiles)
                .HasForeignKey(d => d.CommentId)
                .HasConstraintName("fk_file_comment");
            entity.HasOne(d => d.UploadedByNavigation).WithMany(p => p.TaskCommentFiles)
                .HasForeignKey(d => d.UploadedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_file_user");
        });
        modelBuilder.Entity<TaskCustomValue>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__TaskCust__3213E83FA7EA2A13");
            entity.HasIndex(e => new { e.TaskId, e.CustomFieldId }, "UQ__TaskCust__67F86022CF107B98").IsUnique();
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CustomFieldId).HasColumnName("custom_field_id");
            entity.Property(e => e.TaskId).HasColumnName("task_id");
            entity.Property(e => e.Value).HasColumnName("value");
            entity.HasOne(d => d.CustomField).WithMany(p => p.TaskCustomValues)
                .HasForeignKey(d => d.CustomFieldId)
                .HasConstraintName("fk_value_field");
            entity.HasOne(d => d.Task).WithMany(p => p.TaskCustomValues)
                .HasForeignKey(d => d.TaskId)
                .HasConstraintName("fk_value_task");
        });
        modelBuilder.Entity<TaskFile>(entity =>
        {
            entity.HasIndex(e => e.TaskId, "IX_TaskFiles_TaskId");
            entity.HasOne(d => d.Task).WithMany(p => p.TaskFiles).HasForeignKey(d => d.TaskId);
        });
        modelBuilder.Entity<TaskHistory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__TaskHist__3213E83F9D51E2D3");
            entity.HasIndex(e => new { e.TaskId, e.ChangedAt }, "IX_TaskHistories_Task_ChangedAt").IsDescending(false, true);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ChangedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("changed_at");
            entity.Property(e => e.FieldName)
                .HasMaxLength(50)
                .HasColumnName("field_name");
            entity.Property(e => e.NewValue).HasColumnName("new_value");
            entity.Property(e => e.OldValue).HasColumnName("old_value");
            entity.Property(e => e.TaskId).HasColumnName("task_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.HasOne(d => d.Task).WithMany(p => p.TaskHistories)
                .HasForeignKey(d => d.TaskId)
                .HasConstraintName("fk_history_task");
            entity.HasOne(d => d.User).WithMany(p => p.TaskHistories)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_history_user");
        });
        modelBuilder.Entity<TaskImage>(entity =>
        {
            entity.HasIndex(e => e.TaskId, "IX_TaskImages_TaskId");
            entity.HasOne(d => d.Task).WithMany(p => p.TaskImages).HasForeignKey(d => d.TaskId);
        });
        modelBuilder.Entity<Team>(entity =>
        {
            entity.HasKey(e => e.Id)
                .HasName("PK__Teams__3213E83E3D73D64B")
                .IsClustered(false);
            entity.HasIndex(e => e.Code, "UQ__Teams__357D4CF969539772").IsUnique();
            entity.HasIndex(e => e.DepartmentId, "idx_clustered").IsClustered();
            entity.HasIndex(e => e.Code, "idx_code");
            entity.HasIndex(e => e.LeadId, "idx_lead");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Code)
                .HasMaxLength(15)
                .HasColumnName("code");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.LeadId).HasColumnName("lead_id");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.HasOne(d => d.Department).WithMany(p => p.Teams)
                .HasForeignKey(d => d.DepartmentId)
                .HasConstraintName("FK__Teams__departmen__49C3F6B7");
            entity.HasOne(d => d.Lead).WithMany(p => p.Teams)
                .HasForeignKey(d => d.LeadId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK__Teams__lead_id__4AB81AF0");
        });
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id)
                .HasName("PK__Users__3213E83EDB63439D")
                .IsClustered(false);
            entity.HasIndex(e => e.Email, "UQ__Users__AB6E616477DFC3A5").IsUnique();
            entity.HasIndex(e => e.EmployeeCode, "UQ__Users__B0AA734586EC8834").IsUnique();
            entity.HasIndex(e => e.Username, "UQ__Users__F3DBC572B4788C8F").IsUnique();
            entity.HasIndex(e => new { e.DepartmentId, e.IsActive }, "idx_clustered").IsClustered();
            entity.HasIndex(e => e.Email, "idx_email");
            entity.HasIndex(e => e.EmployeeCode, "idx_employee_code");
            entity.HasIndex(e => new { e.FirstName, e.LastName }, "idx_name_search");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AvatarUrl).HasColumnName("avatar_url");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.DepartmentId).HasColumnName("department_id");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .HasColumnName("email");
            entity.Property(e => e.EmployeeCode)
                .HasMaxLength(20)
                .HasColumnName("employee_code");
            entity.Property(e => e.FirstName)
                .HasMaxLength(50)
                .HasColumnName("first_name");
            entity.Property(e => e.IsActive)
                .HasDefaultValue(true)
                .HasColumnName("is_active");
            entity.Property(e => e.LastName)
                .HasMaxLength(50)
                .HasColumnName("last_name");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .HasColumnName("password_hash");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .HasColumnName("username");
            entity.HasOne(d => d.Department).WithMany(p => p.Users)
                .HasForeignKey(d => d.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_user_department");
            entity.HasMany(d => d.Roles).WithMany(p => p.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "UserRole",
                    r => r.HasOne<Role>().WithMany()
                        .HasForeignKey("RoleId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK__UserRoles__role___4E88ABD4"),
                    l => l.HasOne<User>().WithMany()
                        .HasForeignKey("UserId")
                        .HasConstraintName("FK__UserRoles__user___4D94879B"),
                    j =>
                    {
                        j.HasKey("UserId", "RoleId").HasName("PK__UserRole__6EDEA153BF024A98");
                        j.ToTable("UserRoles");
                        j.HasIndex(new[] { "RoleId" }, "idx_role_user");
                        j.IndexerProperty<long>("UserId").HasColumnName("user_id");
                        j.IndexerProperty<short>("RoleId").HasColumnName("role_id");
                    });
        });
        modelBuilder.Entity<UserTeamAssignment>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.TeamId }).HasName("PK__UserTeam__663CE9D49EDB7EC8");
            entity.HasIndex(e => e.TeamId, "idx_team_users");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.TeamId).HasColumnName("team_id");
            entity.Property(e => e.AssignedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("assigned_at");
            entity.HasOne(d => d.Team).WithMany(p => p.UserTeamAssignments)
                .HasForeignKey(d => d.TeamId)
                .HasConstraintName("FK__UserTeamA__team___534D60F1");
            entity.HasOne(d => d.User).WithMany(p => p.UserTeamAssignments)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__UserTeamA__user___52593CB8");
        });
        modelBuilder.Entity<UserProjectAssignment>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.ProjectId }).HasName("PK__UserProject__UserProject");
            entity.HasIndex(e => e.ProjectId, "idx_project_users");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.AssignedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("assigned_at");
            entity.Property(e => e.Role)
                .HasMaxLength(50)
                .HasColumnName("role");
            entity.HasOne(d => d.Project).WithMany(p => p.UserProjectAssignments)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK__UserProjectA__project");
            entity.HasOne(d => d.User).WithMany(p => p.UserProjectAssignments)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK__UserProjectA__user");
        });
        modelBuilder.Entity<VwScrumBoardTask>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_ScrumBoard_Tasks");
            entity.Property(e => e.ActualHours)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("actual_hours");
            entity.Property(e => e.AssigneeName)
                .HasMaxLength(101)
                .HasColumnName("assignee_name");
            entity.Property(e => e.AssigneeUsername)
                .HasMaxLength(50)
                .HasColumnName("assignee_username");
            entity.Property(e => e.BoardId).HasColumnName("board_id");
            entity.Property(e => e.BoardName)
                .HasMaxLength(100)
                .HasColumnName("board_name");
            entity.Property(e => e.ColumnId).HasColumnName("column_id");
            entity.Property(e => e.ColumnName)
                .HasMaxLength(50)
                .HasColumnName("column_name");
            entity.Property(e => e.ColumnPosition).HasColumnName("column_position");
            entity.Property(e => e.CreatorUsername)
                .HasMaxLength(50)
                .HasColumnName("creator_username");
            entity.Property(e => e.DueDate)
                .HasColumnType("datetime")
                .HasColumnName("due_date");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.EstimatedHours)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("estimated_hours");
            entity.Property(e => e.Priority)
                .HasMaxLength(20)
                .HasColumnName("priority");
            entity.Property(e => e.ProjectCode)
                .HasMaxLength(20)
                .HasColumnName("project_code");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.SprintId).HasColumnName("sprint_id");
            entity.Property(e => e.SprintName)
                .HasMaxLength(100)
                .HasColumnName("sprint_name");
            entity.Property(e => e.SprintStatus)
                .HasMaxLength(20)
                .HasColumnName("sprint_status");
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasColumnName("status");
            entity.Property(e => e.TaskId).HasColumnName("task_id");
            entity.Property(e => e.TaskPosition).HasColumnName("task_position");
            entity.Property(e => e.Title)
                .HasMaxLength(255)
                .HasColumnName("title");
        });
        modelBuilder.Entity<VwTaskCommentsWithImage>(entity =>
        {
            entity
                .HasNoKey()
                .ToView("vw_TaskComments_WithImages");
            entity.Property(e => e.AdditionalImagesJson).HasColumnName("additional_images_json");
            entity.Property(e => e.CommentId).HasColumnName("comment_id");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.CreatedAt)
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.FullName)
                .HasMaxLength(101)
                .HasColumnName("full_name");
            entity.Property(e => e.IsReview).HasColumnName("is_review");
            entity.Property(e => e.ParentCommentId).HasColumnName("parent_comment_id");
            entity.Property(e => e.PrimaryImageUrl)
                .HasMaxLength(500)
                .HasColumnName("primary_image_url");
            entity.Property(e => e.Rating).HasColumnName("rating");
            entity.Property(e => e.TaskId).HasColumnName("task_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .HasColumnName("username");
        });
        modelBuilder.Entity<WorkflowScheme>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Workflow__3213E83F4CFD9B5A");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .HasColumnName("name");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.HasOne(d => d.Project).WithMany(p => p.WorkflowSchemes)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_workflow_project");
        });
        modelBuilder.Entity<WorkflowStatus>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Workflow__3213E83FEB9CE33A");
            entity.HasIndex(e => e.WorkflowSchemeId, "idx_workflow");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Color)
                .HasMaxLength(7)
                .HasDefaultValue("#DFEC64")
                .HasColumnName("color");
            entity.Property(e => e.IsInitial)
                .HasDefaultValue(false)
                .HasColumnName("is_initial");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
            entity.Property(e => e.WorkflowSchemeId).HasColumnName("workflow_scheme_id");
            entity.HasOne(d => d.WorkflowScheme).WithMany(p => p.WorkflowStatuses)
                .HasForeignKey(d => d.WorkflowSchemeId)
                .HasConstraintName("fk_status_scheme");
        });
        modelBuilder.Entity<WorkflowTransition>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Workflow__3213E83F7676F028");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.FromStatusId).HasColumnName("from_status_id");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .HasColumnName("name");
            entity.Property(e => e.ToStatusId).HasColumnName("to_status_id");
            entity.HasOne(d => d.FromStatus).WithMany(p => p.WorkflowTransitionFromStatuses)
                .HasForeignKey(d => d.FromStatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_trans_from");
            entity.HasOne(d => d.ToStatus).WithMany(p => p.WorkflowTransitionToStatuses)
                .HasForeignKey(d => d.ToStatusId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("fk_trans_to");
        });
        modelBuilder.Entity<ProjectEvaluation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ProjectE__3213E83F_ProjectEvaluation");
            entity.HasIndex(e => new { e.ProjectId, e.UserId }, "IX_ProjectEvaluations_Project_User").IsUnique();
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.QualityRating).HasColumnName("quality_rating");
            entity.Property(e => e.QualityComment).HasColumnName("quality_comment");
            entity.Property(e => e.CostRating).HasColumnName("cost_rating");
            entity.Property(e => e.CostComment).HasColumnName("cost_comment");
            entity.Property(e => e.DeliveryRating).HasColumnName("delivery_rating");
            entity.Property(e => e.DeliveryComment).HasColumnName("delivery_comment");
            entity.Property(e => e.GeneralComment).HasColumnName("general_comment");
            entity.Property(e => e.DeploymentTime).HasColumnName("deployment_time");
            entity.Property(e => e.EvaluatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("evaluated_at");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.HasOne(d => d.Project).WithMany(p => p.ProjectEvaluations)
                .HasForeignKey(d => d.ProjectId)
                .HasConstraintName("fk_evaluation_project");
            entity.HasOne(d => d.User).WithMany()
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_evaluation_user");
        });
        modelBuilder.Entity<ProjectImprovement>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ProjectI__3213E83F_ProjectImprovement");
            entity.HasIndex(e => new { e.ProjectId, e.Type, e.Category }, "IX_ProjectImprovements_Project_Type_Category");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.Type)
                .HasMaxLength(20)
                .HasColumnName("type");
            entity.Property(e => e.Category)
                .HasMaxLength(20)
                .HasColumnName("category");
            entity.Property(e => e.Title).HasColumnName("title");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.Status).HasColumnName("status");
            entity.Property(e => e.Level).HasColumnName("level");
            entity.Property(e => e.ExpectedBenefit).HasColumnName("expected_benefit");
            entity.Property(e => e.ActualBenefit).HasColumnName("actual_benefit");
            entity.Property(e => e.ParticipantsCount).HasColumnName("participants_count");
            entity.Property(e => e.OrderIndex).HasColumnName("order_index");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.HasOne(d => d.Project).WithMany(p => p.ProjectImprovements)
                .HasForeignKey(d => d.ProjectId)
                .HasConstraintName("fk_improvement_project");
            entity.HasOne(d => d.CreatedByNavigation).WithMany()
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("fk_project_improvement_user")
                .OnDelete(DeleteBehavior.SetNull);
        });
        modelBuilder.Entity<ProjectTrialEvaluation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ProjectT__3213E83F_ProjectTrialEvaluation");
            entity.HasIndex(e => new { e.ProjectId, e.OrderIndex }, "IX_ProjectTrialEvaluations_Project_Order");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.OrderIndex).HasColumnName("order_index");
            entity.Property(e => e.ReductionItem)
                .HasMaxLength(500)
                .HasColumnName("reduction_item");
            entity.Property(e => e.ManHours)
                .HasMaxLength(100)
                .HasColumnName("man_hours");
            entity.Property(e => e.BeforeImprovement)
                .HasMaxLength(500)
                .HasColumnName("before_improvement");
            entity.Property(e => e.AfterImprovement)
                .HasMaxLength(500)
                .HasColumnName("after_improvement");
            entity.Property(e => e.EstimatedEfficiency)
                .HasMaxLength(500)
                .HasColumnName("estimated_efficiency");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.HasOne(d => d.Project).WithMany(p => p.ProjectTrialEvaluations)
                .HasForeignKey(d => d.ProjectId)
                .HasConstraintName("fk_trial_evaluation_project");
            entity.HasOne(d => d.User).WithMany()
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_trial_evaluation_user")
                .OnDelete(DeleteBehavior.SetNull);
        });
        modelBuilder.Entity<ProjectImage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ProjectI__3213E83F_ProjectImage");
            entity.HasIndex(e => e.ProjectId, "IX_ProjectImages_ProjectId");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.ImageUrl)
                .HasMaxLength(500)
                .HasColumnName("image_url");
            entity.Property(e => e.FileName)
                .HasMaxLength(255)
                .HasColumnName("file_name");
            entity.Property(e => e.FileSizeKb).HasColumnName("file_size_kb");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.UploadedBy).HasColumnName("uploaded_by");
            entity.Property(e => e.UploadedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("uploaded_at");
            entity.HasOne(d => d.Project).WithMany(p => p.ProjectImages)
                .HasForeignKey(d => d.ProjectId)
                .HasConstraintName("fk_project_image_project");
            entity.HasOne(d => d.UploadedByNavigation).WithMany()
                .HasForeignKey(d => d.UploadedBy)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("fk_project_image_user");
        });
        modelBuilder.Entity<ProjectProcess>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ProjectP__3213E83F_ProjectProcess");
            entity.HasIndex(e => new { e.ProjectId, e.UserId }, "IX_ProjectProcesses_Project_User");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.ProcessDescription).HasColumnName("process_description");
            entity.Property(e => e.ProcessOverview).HasColumnName("process_overview");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("updated_at");
            entity.HasOne(d => d.Project).WithMany(p => p.ProjectProcesses)
                .HasForeignKey(d => d.ProjectId)
                .HasConstraintName("fk_project_process_project");
            entity.HasOne(d => d.User).WithMany()
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_project_process_user")
                .OnDelete(DeleteBehavior.SetNull);
        });
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Notifica__3213E83F_Notification");
            entity.HasIndex(e => new { e.UserId, e.IsRead, e.CreatedAt }, "IX_Notifications_User_Read_CreatedAt").IsDescending(false, false, true);
            entity.HasIndex(e => e.ProjectId, "IX_Notifications_ProjectId");
            entity.HasIndex(e => e.TaskId, "IX_Notifications_TaskId");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Type)
                .HasMaxLength(50)
                .HasColumnName("type");
            entity.Property(e => e.Title)
                .HasMaxLength(200)
                .HasColumnName("title");
            entity.Property(e => e.Message).HasColumnName("message");
            entity.Property(e => e.ProjectId).HasColumnName("project_id");
            entity.Property(e => e.TaskId).HasColumnName("task_id");
            entity.Property(e => e.CommentId).HasColumnName("comment_id");
            entity.Property(e => e.EvaluationId).HasColumnName("evaluation_id");
            entity.Property(e => e.IsRead)
                .HasDefaultValue(false)
                .HasColumnName("is_read");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("created_at");
            entity.Property(e => e.ReadAt)
                .HasColumnType("datetime")
                .HasColumnName("read_at");
            entity.HasOne(d => d.User).WithMany()
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("fk_notification_user")
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(d => d.Project).WithMany()
                .HasForeignKey(d => d.ProjectId)
                .HasConstraintName("fk_notification_project")
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(d => d.Task).WithMany()
                .HasForeignKey(d => d.TaskId)
                .HasConstraintName("fk_notification_task")
                .OnDelete(DeleteBehavior.SetNull);
        });
        OnModelCreatingPartial(modelBuilder);
    }
    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
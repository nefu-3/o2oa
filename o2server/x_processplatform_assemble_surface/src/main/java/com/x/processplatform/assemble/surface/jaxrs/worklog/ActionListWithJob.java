package com.x.processplatform.assemble.surface.jaxrs.worklog;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.entity.JpaObject;
import com.x.base.core.project.bean.WrapCopier;
import com.x.base.core.project.bean.WrapCopierFactory;
import com.x.base.core.project.exception.ExceptionAccessDenied;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.base.core.project.tools.ListTools;
import com.x.processplatform.assemble.surface.Business;
import com.x.processplatform.assemble.surface.ThisApplication;
import com.x.processplatform.core.entity.content.Read;
import com.x.processplatform.core.entity.content.ReadCompleted;
import com.x.processplatform.core.entity.content.Task;
import com.x.processplatform.core.entity.content.TaskCompleted;
import com.x.processplatform.core.entity.content.WorkLog;

class ActionListWithJob extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(ActionListWithJob.class);

	private static final String TASKLIST_FIELDNAME = "taskList";
	private static final String TASKCOMPLETEDLIST_FIELDNAME = "taskCompletedList";
	private static final String READLIST_FIELDNAME = "readList";
	private static final String READCOMPLETEDLIST_FIELDNAME = "readCompletedList";

	ActionResult<List<Wo>> execute(EffectivePerson effectivePerson, String job) throws Exception {
		ActionResult<List<Wo>> result = new ActionResult<>();
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {

			Business business = new Business(emc);

			if (!business.readableWithJob(effectivePerson, job)) {
				throw new ExceptionAccessDenied(effectivePerson);
			}
		}

		CompletableFuture<List<WoTask>> futureTasks = CompletableFuture.supplyAsync(() -> this.tasks(job),
				ThisApplication.threadPool());
		CompletableFuture<List<WoTaskCompleted>> futureTaskCompleteds = CompletableFuture
				.supplyAsync(() -> this.taskCompleteds(job), ThisApplication.threadPool());
		CompletableFuture<List<WoRead>> futureReads = CompletableFuture.supplyAsync(() -> this.reads(job),
				ThisApplication.threadPool());
		CompletableFuture<List<WoReadCompleted>> futureReadCompleteds = CompletableFuture
				.supplyAsync(() -> this.readCompleteds(job), ThisApplication.threadPool());
		CompletableFuture<List<Wo>> futureWorkLogs = CompletableFuture.supplyAsync(() -> this.workLogs(job),
				ThisApplication.threadPool());
		List<WoTask> tasks = futureTasks.get();
		List<WoTaskCompleted> taskCompleteds = futureTaskCompleteds.get();
		List<WoRead> reads = futureReads.get();
		List<WoReadCompleted> readCompleteds = futureReadCompleteds.get();
		List<Wo> wos = futureWorkLogs.get();
		ListTools.groupStick(wos, tasks, WorkLog.FROMACTIVITYTOKEN_FIELDNAME, Task.activityToken_FIELDNAME,
				TASKLIST_FIELDNAME);
		ListTools.groupStick(wos, taskCompleteds, WorkLog.FROMACTIVITYTOKEN_FIELDNAME,
				TaskCompleted.activityToken_FIELDNAME, TASKCOMPLETEDLIST_FIELDNAME);
		ListTools.groupStick(wos, reads, WorkLog.FROMACTIVITYTOKEN_FIELDNAME, Read.activityToken_FIELDNAME,
				READLIST_FIELDNAME);
		ListTools.groupStick(wos, readCompleteds, WorkLog.FROMACTIVITYTOKEN_FIELDNAME,
				ReadCompleted.activityToken_FIELDNAME, READCOMPLETEDLIST_FIELDNAME);
		result.setData(wos);
		return result;
	}

	private List<WoTask> tasks(String job) {
		List<WoTask> os = new ArrayList<>();
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			os = emc.fetchEqual(Task.class, WoTask.copier, WoTask.job_FIELDNAME, job).stream()
					.sorted(Comparator.comparing(Task::getStartTime, Comparator.nullsLast(Date::compareTo)))
					.collect(Collectors.toList());
		} catch (Exception e) {
			LOGGER.error(e);
		}
		return os;
	}

	private List<WoTaskCompleted> taskCompleteds(String job) {
		List<WoTaskCompleted> os = new ArrayList<>();
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			os = emc.fetchEqual(TaskCompleted.class, WoTaskCompleted.copier, TaskCompleted.job_FIELDNAME, job).stream()
					.sorted(Comparator.comparing(TaskCompleted::getStartTime, Comparator.nullsLast(Date::compareTo)))
					.collect(Collectors.toList());
		} catch (Exception e) {
			LOGGER.error(e);
		}
		return os;
	}

	private List<WoRead> reads(String job) {
		List<WoRead> os = new ArrayList<>();
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			os = emc.fetchEqual(Read.class, WoRead.copier, Read.job_FIELDNAME, job).stream()
					.sorted(Comparator.comparing(Read::getStartTime, Comparator.nullsLast(Date::compareTo)))
					.collect(Collectors.toList());
		} catch (Exception e) {
			LOGGER.error(e);
		}
		return os;
	}

	private List<WoReadCompleted> readCompleteds(String job) {
		List<WoReadCompleted> os = new ArrayList<>();
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			os = emc.fetchEqual(ReadCompleted.class, WoReadCompleted.copier, ReadCompleted.job_FIELDNAME, job).stream()
					.sorted(Comparator.comparing(ReadCompleted::getStartTime, Comparator.nullsLast(Date::compareTo)))
					.collect(Collectors.toList());
		} catch (Exception e) {
			LOGGER.error(e);
		}
		return os;
	}

	private List<Wo> workLogs(String job) {
		List<Wo> list = new ArrayList<>();
		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			List<WorkLog> os = emc.listEqual(WorkLog.class, WorkLog.JOB_FIELDNAME, job);
			list = os.stream().map(Wo.copier::copy).collect(Collectors.toList());
		} catch (Exception e) {
			LOGGER.error(e);
		}
		return list;

//		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
//		os = emc.fetchEqual(WorkLog.class, Wo.copier, WorkLog.JOB_FIELDNAME, job);
//			return os.stream()
//					.sorted(Comparator.comparing(Wo::getFromTime, Comparator.nullsLast(Date::compareTo))
//							.thenComparing(Wo::getArrivedTime, Comparator.nullsLast(Date::compareTo)))
//					.collect(Collectors.toList());
//		} catch (Exception e) {
//			logger.error(e);
//		}
//		return os;
	}

	public static class Wo extends WorkLog {

		private static final long serialVersionUID = -7666329770246726197L;

//		static WrapCopier<WorkLog, Wo> copier = WrapCopierFactory.wo(WorkLog.class, Wo.class,
//				ListTools.toList(WorkLog.id_FIELDNAME, WorkLog.FROMACTIVITY_FIELDNAME,
//						WorkLog.FROMACTIVITYTYPE_FIELDNAME, WorkLog.FROMACTIVITYNAME_FIELDNAME,
//						WorkLog.FROMACTIVITYALIAS_FIELDNAME, WorkLog.FROMACTIVITYTOKEN_FIELDNAME,
//						WorkLog.FROMTIME_FIELDNAME, WorkLog.ARRIVEDACTIVITY_FIELDNAME,
//						WorkLog.ARRIVEDACTIVITYTYPE_FIELDNAME, WorkLog.ARRIVEDACTIVITYNAME_FIELDNAME,
//						WorkLog.ARRIVEDACTIVITYALIAS_FIELDNAME, WorkLog.ARRIVEDACTIVITYTOKEN_FIELDNAME,
//						WorkLog.ARRIVEDTIME_FIELDNAME, WorkLog.ROUTENAME_FIELDNAME, WorkLog.CONNECTED_FIELDNAME,
//						WorkLog.SPLITTING_FIELDNAME, WorkLog.FROMGROUP_FIELDNAME, WorkLog.ARRIVEDGROUP_FIELDNAME,
//						WorkLog.FROMOPINIONGROUP_FIELDNAME, WorkLog.ARRIVEDOPINIONGROUP_FIELDNAME),
//				JpaObject.FieldsInvisible);

		static WrapCopier<WorkLog, Wo> copier = WrapCopierFactory.wo(WorkLog.class, Wo.class, null,
				JpaObject.FieldsInvisible);

		private List<WoTask> taskList = new ArrayList<>();

		private List<WoTaskCompleted> taskCompletedList = new ArrayList<>();

		private List<WoRead> readList = new ArrayList<>();

		private List<WoReadCompleted> readCompletedList = new ArrayList<>();

		public List<WoTask> getTaskList() {
			return taskList;
		}

		public void setTaskList(List<WoTask> taskList) {
			this.taskList = taskList;
		}

		public List<WoTaskCompleted> getTaskCompletedList() {
			return taskCompletedList;
		}

		public void setTaskCompletedList(List<WoTaskCompleted> taskCompletedList) {
			this.taskCompletedList = taskCompletedList;
		}

		public List<WoRead> getReadList() {
			return readList;
		}

		public void setReadList(List<WoRead> readList) {
			this.readList = readList;
		}

		public List<WoReadCompleted> getReadCompletedList() {
			return readCompletedList;
		}

		public void setReadCompletedList(List<WoReadCompleted> readCompletedList) {
			this.readCompletedList = readCompletedList;
		}

	}

	public static class WoTask extends Task {

		private static final long serialVersionUID = 293599148568443301L;

		static WrapCopier<Task, WoTask> copier = WrapCopierFactory.wo(Task.class, WoTask.class,
				ListTools.toList(Task.id_FIELDNAME, Task.person_FIELDNAME, Task.identity_FIELDNAME, Task.unit_FIELDNAME,
						Task.routeName_FIELDNAME, Task.opinion_FIELDNAME, Task.opinionLob_FIELDNAME,
						Task.startTime_FIELDNAME, Task.activityName_FIELDNAME, Task.activityToken_FIELDNAME),
				null);
	}

	public static class WoTaskCompleted extends TaskCompleted {

		private static final long serialVersionUID = -4432508672641778924L;

		static WrapCopier<TaskCompleted, WoTaskCompleted> copier = WrapCopierFactory.wo(TaskCompleted.class,
				WoTaskCompleted.class,
				ListTools.toList(TaskCompleted.id_FIELDNAME, TaskCompleted.person_FIELDNAME,
						TaskCompleted.identity_FIELDNAME, TaskCompleted.unit_FIELDNAME,
						TaskCompleted.routeName_FIELDNAME, TaskCompleted.opinion_FIELDNAME,
						TaskCompleted.opinionLob_FIELDNAME, TaskCompleted.startTime_FIELDNAME,
						TaskCompleted.activityName_FIELDNAME, TaskCompleted.completedTime_FIELDNAME,
						TaskCompleted.activityToken_FIELDNAME, TaskCompleted.mediaOpinion_FIELDNAME),
				null);
	}

	public static class WoRead extends Read {

		private static final long serialVersionUID = -7243683008987722267L;

		static WrapCopier<Read, WoRead> copier = WrapCopierFactory.wo(Read.class, WoRead.class,
				ListTools.toList(Read.id_FIELDNAME, Read.person_FIELDNAME, Read.identity_FIELDNAME, Read.unit_FIELDNAME,
						Read.opinion_FIELDNAME, Read.opinionLob_FIELDNAME, Read.startTime_FIELDNAME,
						Read.activityName_FIELDNAME, Read.activityToken_FIELDNAME),
				null);
	}

	public static class WoReadCompleted extends ReadCompleted {

		private static final long serialVersionUID = -7086077858353505033L;

		static WrapCopier<ReadCompleted, WoReadCompleted> copier = WrapCopierFactory.wo(ReadCompleted.class,
				WoReadCompleted.class,
				ListTools.toList(ReadCompleted.id_FIELDNAME, ReadCompleted.person_FIELDNAME,
						ReadCompleted.identity_FIELDNAME, ReadCompleted.unit_FIELDNAME, ReadCompleted.opinion_FIELDNAME,
						ReadCompleted.opinionLob_FIELDNAME, ReadCompleted.startTime_FIELDNAME,
						ReadCompleted.activityName_FIELDNAME, ReadCompleted.completedTime_FIELDNAME,
						ReadCompleted.activityToken_FIELDNAME),
				null);
	}

}
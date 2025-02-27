package com.x.processplatform.assemble.surface.jaxrs.attachment;

import java.util.List;
import java.util.Optional;

import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.BooleanUtils;
import org.apache.commons.lang3.StringUtils;

import com.x.base.core.container.EntityManagerContainer;
import com.x.base.core.container.factory.EntityManagerContainerFactory;
import com.x.base.core.project.config.Config;
import com.x.base.core.project.config.ProcessPlatform.WorkCompletedExtensionEvent;
import com.x.base.core.project.config.StorageMapping;
import com.x.base.core.project.connection.CipherConnectionAction;
import com.x.base.core.project.exception.ExceptionEntityNotExist;
import com.x.base.core.project.http.ActionResult;
import com.x.base.core.project.http.EffectivePerson;
import com.x.base.core.project.jaxrs.WoFile;
import com.x.base.core.project.logger.Logger;
import com.x.base.core.project.logger.LoggerFactory;
import com.x.processplatform.assemble.surface.Business;
import com.x.processplatform.assemble.surface.ThisApplication;
import com.x.processplatform.assemble.surface.WorkCompletedControl;
import com.x.processplatform.core.entity.content.Attachment;
import com.x.processplatform.core.entity.content.WorkCompleted;

import io.swagger.v3.oas.annotations.media.Schema;

class ActionDownloadWithWorkCompletedStream extends BaseAction {

	private static final Logger LOGGER = LoggerFactory.getLogger(ActionDownloadWithWorkCompletedStream.class);

	ActionResult<Wo> execute(EffectivePerson effectivePerson, String id, String workCompletedId, String fileName)
			throws Exception {

		LOGGER.debug("execute:{}, id:{}, workCompletedId:{}.", effectivePerson::getDistinguishedName, () -> id,
				() -> workCompletedId);

		ActionResult<Wo> result = new ActionResult<>();
		WorkCompleted workCompleted = null;
		Attachment attachment = null;

		try (EntityManagerContainer emc = EntityManagerContainerFactory.instance().create()) {
			Business business = new Business(emc);
			workCompleted = emc.find(workCompletedId, WorkCompleted.class);
			if (null == workCompleted) {
				throw new ExceptionEntityNotExist(workCompletedId, WorkCompleted.class);
			}
			attachment = emc.find(id, Attachment.class);
			if (null == attachment) {
				throw new ExceptionEntityNotExist(id, Attachment.class);
			}
			Control control = business.getControl(effectivePerson, workCompleted, Control.class);
			if (BooleanUtils.isNotTrue(control.getAllowVisit())) {
				throw new ExceptionWorkCompletedAccessDenied(effectivePerson.getDistinguishedName(),
						workCompleted.getTitle(), workCompleted.getId());
			}
			List<String> ids = business.attachment().listWithJob(workCompleted.getJob());
			if (!ids.contains(id)) {
				throw new ExceptionWorkCompletedNotContainsAttachment(workCompleted.getTitle(), workCompleted.getId(),
						attachment.getName(), attachment.getId());
			}
		}
		StorageMapping mapping = ThisApplication.context().storageMappings().get(Attachment.class,
				attachment.getStorage());
		if (StringUtils.isBlank(fileName)) {
			fileName = attachment.getName();
		} else {
			String extension = FilenameUtils.getExtension(fileName);
			if (StringUtils.isEmpty(extension)) {
				fileName = fileName + "." + attachment.getExtension();
			}
		}
		byte[] bytes = null;
		Optional<WorkCompletedExtensionEvent> event = Config.processPlatform().getExtensionEvents()
				.getWorkCompletedAttachmentDownloadEvents()
				.bind(workCompleted.getApplication(), workCompleted.getProcess());
		if (event.isPresent()) {
			bytes = this.extensionService(effectivePerson, attachment, event.get());
		} else {
			bytes = attachment.readContent(mapping);
		}
		Wo wo = new Wo(bytes, this.contentType(true, fileName), this.contentDisposition(true, fileName));
		result.setData(wo);
		return result;
	}

	public static class Control extends WorkCompletedControl {

		private static final long serialVersionUID = 3188995088978737337L;

	}

	@Schema(name = "com.x.processplatform.assemble.surface.jaxrs.attachment.ActionDownloadWithWorkCompletedStream$Wo")
	public static class Wo extends WoFile {

		private static final long serialVersionUID = -5504797743271343773L;

		public Wo(byte[] bytes, String contentType, String contentDisposition) {
			super(bytes, contentType, contentDisposition);
		}

	}

}

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email(false));

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email(isReply, email) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // if this is a reply, we need to prefill the form fields
  if (isReply) {

    document.querySelector('#compose-recipients').value = email.sender;

    if (email.subject.substring(0,3) !== "Re:") {
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    } else {
      document.querySelector('#compose-subject').value = email.subject;
    }

    document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp}, ${email.sender} wrote:\n${email.body}`;

  } else {

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';

  }

  // clear out error errorDiv
  const errorDiv = document.querySelector('#error');
  errorDiv.className = "";
  errorDiv.innerHTML = "";

  // Send email via POST
  document.querySelector('#compose-form').onsubmit = event => {
    event.preventDefault();

    // Retreiving data from form fields
    const formRecipients = document.querySelector('#compose-recipients');
    const formSubject = document.querySelector('#compose-subject');
    const formBody = document.querySelector('#compose-body');

    // use the API to send the email
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: formRecipients.value,
        subject: formSubject.value,
        body: formBody.value
      })
    })
    .then(response => response.json())
    .then(result => {
      // print result
      console.log(result);

      if (result.error !== undefined) {
        errorDiv.className = "alert alert-danger";
        errorDiv.innerText = result.error;
      } else {
        load_mailbox('sent')
      }
    });

  }
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // clear #emails-view
  const emailsView = document.querySelector('#emails-view');
  while (emailsView.hasChildNodes()) {
    emailsView.removeChild(emailsView.firstChild);
  }

  // Query the API for the mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // print emails
    console.log(emails);

    // display emails in DOM
    emails.forEach(emailContent => display_emails(emailContent, mailbox));
  });

}

function display_emails(contents, mailbox) {
  const email = document.createElement('a');
  email.className = 'email list-group-item list-group-item-action';

  if (contents.read === true) {
    // Makes the list item gray if it has been read already
    email.classList.add("list-group-item-secondary");
  } else if (email.classList.contains("list-group-item-secondary")) {
    // Maybe unnecessary?
    email.classList.remove("list-group-item-secondary");
  }

  const innerDiv = document.createElement('div');
  const item1 = document.createElement('div');
  const item2 = document.createElement('div');
  const item3 = document.createElement('div');

  innerDiv.className = 'd-flex w-100 justify-content-between';
  item1.className = 'p-2';
  item2.className = 'p-2';
  item3.className = 'ml-auto p-2';

  item1.innerHTML = `<strong>${contents.sender}</strong>`;
  item2.innerHTML = `${contents.subject}`;
  item3.innerHTML = `<small class='text-muted'>${contents.timestamp}</small>`;

  innerDiv.append(item1);
  innerDiv.append(item2);
  innerDiv.append(item3);

  email.append(innerDiv);

  email.onclick = () => display_email(contents, mailbox);

  document.querySelector('#emails-view').append(email);
}

function display_email(contents, mailbox) {

  // Show the email views and hide the others
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  // clear #email-header
  const emailHeader = document.querySelector('#email-header');
  while (emailHeader.hasChildNodes()) {
    emailHeader.removeChild(emailHeader.firstChild);
  }

  // modify the archive button based on the mailbox
  const archiveButton = document.querySelector('#archive');
  if (mailbox === 'sent') {
    archiveButton.innerHTML = "Archive";
    archiveButton.style.display = 'none';
  } else if (mailbox === 'archive') {
    archiveButton.innerHTML = "Unarchive";
    archiveButton.style.display = 'inline';
  } else {
    archiveButton.innerHTML = "Archive";
    archiveButton.style.display = 'inline';
  }

  // add event listener to the archive button
  archiveButton.onclick = () => {

    fetch(`emails/${contents.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: !contents.archived
      })
    })
    .then(() => {
      console.log('Email was archived/unarchived.');
    })
    .then(() => load_mailbox('inbox'));

  };

  // add event listener to the reply button
  const replyButton = document.querySelector('#reply');
  replyButton.onclick = () => compose_email(true, contents);

  // get the email info so we can display it
  // could we possibly just use the info in contents?
  fetch(`emails/${contents.id}`)
  .then(response => response.json())
  .then(email => {
    // print email to console
    console.log(email);

    // display email in email-view div
    const fromPar = document.createElement('p');
    const toPar = document.createElement('p');
    const subjectPar = document.createElement('p');
    const timestampPar = document.createElement('p');

    fromPar.innerHTML = `<strong>From:</strong> ${email.sender}`;
    toPar.innerHTML = `<strong>To:</strong> ${email.recipients}`;
    subjectPar.innerHTML = `<strong>Subject:</strong> ${email.subject}`;
    timestampPar.innerHTML = `<strong>Timestamp:</strong> ${email.timestamp}`;

    emailHeader.append(fromPar);
    emailHeader.append(toPar);
    emailHeader.append(subjectPar);
    emailHeader.append(timestampPar);

    document.querySelector('#email-body').innerText = `${email.body}`;

    // mark email as read
    if (email.read === false) {
      fetch(`emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })
      .then(() => console.log('Email marked as read.'));
    }

  });
}

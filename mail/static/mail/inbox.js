document.addEventListener('DOMContentLoaded', function () {
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Handle form submission
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id) {
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      // Display email details
      display_email_details(email);

      // Mark email as read if unread
      if (!email.read) {
        mark_email_as_read(email.id);
      }

      // Add archive/unarchive button
      add_archive_button(email);

      // Add reply button
      add_reply_button(email);
    });
}

function display_email_details(email) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'block';

  document.querySelector('#email-detail-view').innerHTML = `
    <div class="email-details">
      <strong>From:</strong> ${email.sender}<br>
      <strong>To:</strong> ${email.recipients}<br>
      <strong>Subject:</strong> ${email.subject}<br>
      <strong>Timestamp:</strong> ${email.timestamp}<br>
      <hr>
      <div class="email-body">${email.body}</div>
    </div>`;
}

function mark_email_as_read(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ read: true })
  });
}

function add_archive_button(email) {
  const archiveButton = document.createElement('button');
  archiveButton.className = 'btn btn-sm btn-outline-primary';
  archiveButton.style.margin = '10px';
  archiveButton.style.padding = '5px 10px';
  archiveButton.innerHTML = email.archived ? 'Unarchive' : 'Archive';

  archiveButton.addEventListener('click', function () {
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({ archived: !email.archived })
    }).then(() => load_mailbox('inbox'));
  });

  document.querySelector('#email-detail-view').append(archiveButton);
}

function add_reply_button(email) {
  const replyButton = document.createElement('button');
  replyButton.className = 'btn btn-sm btn-outline-secondary';
  replyButton.style.margin = '10px';
  replyButton.style.padding = '5px 10px';
  replyButton.innerHTML = 'Reply';

  replyButton.addEventListener('click', function () {
    compose_email();

    const subjectPrefix = "Re: ";
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = email.subject.startsWith(subjectPrefix) ? email.subject : `${subjectPrefix}${email.subject}`;
    document.querySelector('#compose-body').value = `\n\nOn ${email.timestamp}, ${email.sender} wrote:\n${email.body}`;
  });

  document.querySelector('#email-detail-view').append(replyButton);
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch and display emails
  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(singleEmail => create_email_div(singleEmail));
    });
}

function create_email_div(singleEmail) {
  const newEmail = document.createElement('div');
  newEmail.className = singleEmail.read ? 'read' : 'unread';
  newEmail.innerHTML = `
    <h6>Sender: ${singleEmail.sender}</h6>
    <h5>Subject: ${singleEmail.subject}</h5>
    <p>${singleEmail.timestamp}</p>
  `;

  newEmail.addEventListener('click', function () {
    view_email(singleEmail.id);
  });

  document.querySelector('#emails-view').append(newEmail);
}

function send_email(event) {
  event.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({ recipients, subject, body })
  })
    .then(response => response.json())
    .then(result => {
      console.log(result);
      load_mailbox('sent');
    });
}

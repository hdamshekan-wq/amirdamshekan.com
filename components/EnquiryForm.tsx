"use client";

import { FormEvent, useState } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function EnquiryForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      company: String(data.get("company") || ""),
      enquiryType: String(data.get("enquiryType") || ""),
      details: String(data.get("details") || ""),
      preferredContact: String(data.get("preferredContact") || ""),
      website: String(data.get("website") || ""),
    };

    try {
      const response = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.message || "Unable to submit the enquiry.");
      }

      form.reset();
      setState("success");
      setMessage("Thank you. Your enquiry has been received successfully.");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit the enquiry. Please email info@amirdamshekan.com."
      );
    }
  }

  return (
    <form className="enquiry-form" onSubmit={handleSubmit} noValidate>
      <label>
        <span>Name</span>
        <input name="name" type="text" placeholder="Your name" autoComplete="name" maxLength={120} required />
      </label>

      <label>
        <span>Email</span>
        <input name="email" type="email" placeholder="you@company.com" autoComplete="email" maxLength={180} required />
      </label>

      <label>
        <span>Company / Organization</span>
        <input name="company" type="text" placeholder="Optional" autoComplete="organization" maxLength={180} />
      </label>

      <label>
        <span>Enquiry Type</span>
        <select name="enquiryType" defaultValue="Engineering Project" required>
          <option>Engineering Project</option>
          <option>Consultation</option>
          <option>MarineStruc & Software</option>
          <option>Licensing</option>
          <option>Training / Academy</option>
          <option>Other</option>
        </select>
      </label>

      <label className="full">
        <span>Project / Request Details</span>
        <textarea
          name="details"
          rows={5}
          placeholder="Briefly describe the project, location, scope, schedule or the support you need."
          maxLength={5000}
          required
        />
      </label>

      <label className="full">
        <span>Preferred Contact</span>
        <select name="preferredContact" defaultValue="Email" required>
          <option>Email</option>
          <option>Phone</option>
          <option>Video Meeting</option>
        </select>
      </label>

      <label className="enquiry-honeypot" aria-hidden="true">
        <span>Website</span>
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="enquiry-form-actions full">
        <button className="btn primary enquiry-submit" type="submit" disabled={state === "submitting"}>
          {state === "submitting" ? "Submitting..." : "Start Enquiry"}
          <span aria-hidden="true">&rarr;</span>
        </button>
        <span className="enquiry-privacy-note">
          By submitting, you agree to the <a href="/privacy">Privacy Policy</a>.
        </span>
      </div>

      {message ? (
        <p
          className={`enquiry-status full ${state === "success" ? "success" : "error"}`}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}

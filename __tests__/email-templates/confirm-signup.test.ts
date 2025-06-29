import fs from 'fs'
import path from 'path'

describe('Email Templates', () => {
  const templatesDir = path.join(process.cwd(), 'supabase', 'templates')

  describe('Confirm Signup Template', () => {
    let templateContent: string

    beforeAll(() => {
      const templatePath = path.join(templatesDir, 'confirm_signup.html')
      templateContent = fs.readFileSync(templatePath, 'utf-8')
    })

    it('should contain ReadingRoadmap branding', () => {
      expect(templateContent).toContain('📚 ReadingRoadmap')
      expect(templateContent).toContain('Your personal reading journey starts here')
    })

    it('should contain confirmation button', () => {
      expect(templateContent).toContain('Confirm Email Address')
      expect(templateContent).toContain('{{ .ConfirmationURL }}')
    })

    it('should contain security warning', () => {
      expect(templateContent).toContain('This link will expire in 1 hour')
      expect(templateContent).toContain('Important:')
    })

    it('should contain proper styling', () => {
      expect(templateContent).toContain('background-color: #2563eb')
      expect(templateContent).toContain('border-radius: 12px')
      expect(templateContent).toContain('font-family: -apple-system')
    })

    it('should be responsive', () => {
      expect(templateContent).toContain('viewport')
      expect(templateContent).toContain('max-width: 600px')
    })

    it('should contain footer with copyright', () => {
      expect(templateContent).toContain('© 2024 ReadingRoadmap')
      expect(templateContent).toContain('All rights reserved')
    })
  })

  describe('Password Recovery Template', () => {
    let templateContent: string

    beforeAll(() => {
      const templatePath = path.join(templatesDir, 'recovery.html')
      templateContent = fs.readFileSync(templatePath, 'utf-8')
    })

    it('should contain ReadingRoadmap branding', () => {
      expect(templateContent).toContain('📚 ReadingRoadmap')
    })

    it('should contain reset password button', () => {
      expect(templateContent).toContain('Reset Password')
      expect(templateContent).toContain('{{ .ConfirmationURL }}')
    })

    it('should contain security warning', () => {
      expect(templateContent).toContain('Security Notice:')
      expect(templateContent).toContain('This link will expire in 1 hour')
    })

    it('should have different button color for recovery', () => {
      expect(templateContent).toContain('background-color: #dc2626')
    })
  })

  describe('Magic Link Template', () => {
    let templateContent: string

    beforeAll(() => {
      const templatePath = path.join(templatesDir, 'magic_link.html')
      templateContent = fs.readFileSync(templatePath, 'utf-8')
    })

    it('should contain ReadingRoadmap branding', () => {
      expect(templateContent).toContain('📚 ReadingRoadmap')
    })

    it('should contain sign in button', () => {
      expect(templateContent).toContain('Sign In to ReadingRoadmap')
      expect(templateContent).toContain('{{ .ConfirmationURL }}')
    })

    it('should contain security warning', () => {
      expect(templateContent).toContain('Security Notice:')
      expect(templateContent).toContain('This link will expire in 1 hour')
    })

    it('should have green button color for magic link', () => {
      expect(templateContent).toContain('background-color: #059669')
    })
  })

  describe('Invite Template', () => {
    let templateContent: string

    beforeAll(() => {
      const templatePath = path.join(templatesDir, 'invite.html')
      templateContent = fs.readFileSync(templatePath, 'utf-8')
    })

    it('should contain ReadingRoadmap branding', () => {
      expect(templateContent).toContain('📚 ReadingRoadmap')
    })

    it('should contain invitation content', () => {
      expect(templateContent).toContain("You've Been Invited!")
      expect(templateContent).toContain('Accept Invitation')
    })

    it('should contain feature highlights', () => {
      expect(templateContent).toContain('Create reading lists')
      expect(templateContent).toContain('Discover new books')
      expect(templateContent).toContain('Set reading goals')
    })

    it('should have purple button color for invitations', () => {
      expect(templateContent).toContain('background-color: #7c3aed')
    })
  })

  describe('Email Change Template', () => {
    let templateContent: string

    beforeAll(() => {
      const templatePath = path.join(templatesDir, 'email_change.html')
      templateContent = fs.readFileSync(templatePath, 'utf-8')
    })

    it('should contain ReadingRoadmap branding', () => {
      expect(templateContent).toContain('📚 ReadingRoadmap')
    })

    it('should contain email change content', () => {
      expect(templateContent).toContain('Confirm Your New Email Address')
      expect(templateContent).toContain('Confirm New Email')
    })

    it('should contain security warning', () => {
      expect(templateContent).toContain('Security Notice:')
      expect(templateContent).toContain('This link will expire in 1 hour')
    })

    it('should have green button color', () => {
      expect(templateContent).toContain('background-color: #059669')
    })
  })

  describe('Template Consistency', () => {
    it('should have consistent styling across all templates', () => {
      const templates = [
        'confirm_signup.html',
        'recovery.html',
        'magic_link.html',
        'invite.html',
        'email_change.html'
      ]

      templates.forEach(templateName => {
        const templatePath = path.join(templatesDir, templateName)
        const content = fs.readFileSync(templatePath, 'utf-8')
        
        // All templates should have consistent base styling
        expect(content).toContain('font-family: -apple-system')
        expect(content).toContain('max-width: 600px')
        expect(content).toContain('border-radius: 12px')
        expect(content).toContain('📚 ReadingRoadmap')
        expect(content).toContain('© 2024 ReadingRoadmap')
      })
    })

    it('should have proper HTML structure', () => {
      const templates = [
        'confirm_signup.html',
        'recovery.html',
        'magic_link.html',
        'invite.html',
        'email_change.html'
      ]

      templates.forEach(templateName => {
        const templatePath = path.join(templatesDir, templateName)
        const content = fs.readFileSync(templatePath, 'utf-8')
        
        // Should have proper HTML structure
        expect(content).toContain('<!DOCTYPE html>')
        expect(content).toContain('<html>')
        expect(content).toContain('<head>')
        expect(content).toContain('<body>')
        expect(content).toContain('</html>')
        
        // Should have viewport meta tag
        expect(content).toContain('viewport')
        
        // Should have proper encoding
        expect(content).toContain('charset="utf-8"')
      })
    })
  })
}) 